ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cod_fee numeric NOT NULL DEFAULT 0;
ALTER TABLE public.delivery_assignments ADD COLUMN IF NOT EXISTS picked_up_at timestamptz;

CREATE OR REPLACE FUNCTION public.assign_order_rider(_order_id uuid)
RETURNS public.delivery_assignments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  ord public.orders;
  st public.stores;
  existing public.delivery_assignments;
  chosen uuid;
  fee numeric := 30;
BEGIN
  SELECT * INTO ord FROM public.orders WHERE id = _order_id;
  IF ord.id IS NULL THEN RAISE EXCEPTION 'Order not found'; END IF;

  IF NOT (public.owns_store(ord.store_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Not allowed to manage this order';
  END IF;

  IF ord.status <> 'merchant_confirmed' THEN
    RAISE EXCEPTION 'Order must be confirmed before assigning a delivery partner';
  END IF;

  SELECT * INTO existing FROM public.delivery_assignments WHERE order_id = _order_id LIMIT 1;
  IF existing.id IS NOT NULL THEN
    RETURN existing;
  END IF;

  SELECT r.id INTO chosen
  FROM public.riders r
  WHERE r.is_verified AND r.is_online
  ORDER BY (
    SELECT count(*) FROM public.delivery_assignments d
    WHERE d.rider_id = r.id AND d.status NOT IN ('delivered', 'cancelled')
  ) ASC, r.rating DESC
  LIMIT 1;

  IF chosen IS NULL THEN
    RAISE EXCEPTION 'No delivery partner is online right now';
  END IF;

  SELECT * INTO st FROM public.stores WHERE id = ord.store_id;

  INSERT INTO public.delivery_assignments
    (order_id, rider_id, pickup_location, drop_location, earnings, status)
  VALUES
    (_order_id, chosen, COALESCE(st.name, 'Store'), COALESCE(ord.delivery_address, 'Customer'), fee, 'partner_assigned')
  RETURNING * INTO existing;

  UPDATE public.orders
     SET status = 'partner_assigned', assigned_at = now(), updated_at = now()
   WHERE id = _order_id;

  RETURN existing;
END;
$$;

CREATE OR REPLACE FUNCTION public.rider_update_delivery(_assignment_id uuid, _action text)
RETURNS public.delivery_assignments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  asg public.delivery_assignments;
BEGIN
  SELECT * INTO asg FROM public.delivery_assignments WHERE id = _assignment_id;
  IF asg.id IS NULL THEN RAISE EXCEPTION 'Delivery not found'; END IF;

  IF NOT (public.is_assignment_rider(asg.rider_id, auth.uid()) OR public.has_role(auth.uid(), 'admin')) THEN
    RAISE EXCEPTION 'Not allowed to update this delivery';
  END IF;

  IF _action = 'accept' THEN
    IF asg.accepted_at IS NOT NULL THEN RAISE EXCEPTION 'Delivery already accepted'; END IF;
    UPDATE public.delivery_assignments
       SET accepted_at = now(), updated_at = now()
     WHERE id = _assignment_id RETURNING * INTO asg;

  ELSIF _action = 'pickup' THEN
    IF asg.accepted_at IS NULL THEN RAISE EXCEPTION 'Accept the delivery first'; END IF;
    UPDATE public.delivery_assignments
       SET picked_up_at = now(), updated_at = now()
     WHERE id = _assignment_id RETURNING * INTO asg;

  ELSIF _action = 'out_for_delivery' THEN
    IF asg.picked_up_at IS NULL THEN RAISE EXCEPTION 'Mark pickup first'; END IF;
    UPDATE public.delivery_assignments
       SET status = 'out_for_delivery', updated_at = now()
     WHERE id = _assignment_id RETURNING * INTO asg;
    UPDATE public.orders
       SET status = 'out_for_delivery', out_for_delivery_at = now(), updated_at = now()
     WHERE id = asg.order_id;

  ELSIF _action = 'delivered' THEN
    IF asg.status <> 'out_for_delivery' THEN RAISE EXCEPTION 'Start the delivery first'; END IF;
    UPDATE public.delivery_assignments
       SET status = 'delivered', delivered_at = now(), updated_at = now()
     WHERE id = _assignment_id RETURNING * INTO asg;
    UPDATE public.orders
       SET status = 'delivered', delivered_at = now(), updated_at = now()
     WHERE id = asg.order_id;

  ELSE
    RAISE EXCEPTION 'Unknown action';
  END IF;

  RETURN asg;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_order_rider(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.rider_update_delivery(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.assign_order_rider(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.rider_update_delivery(uuid, text) TO authenticated, service_role;