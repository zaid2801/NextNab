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

  SELECT * INTO existing FROM public.delivery_assignments WHERE order_id = _order_id LIMIT 1;
  IF existing.id IS NOT NULL THEN
    RETURN existing;
  END IF;

  IF ord.status <> 'merchant_confirmed' THEN
    RAISE EXCEPTION 'Order must be confirmed before assigning a delivery partner';
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