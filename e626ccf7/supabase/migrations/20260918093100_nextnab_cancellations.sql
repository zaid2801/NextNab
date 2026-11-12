-- ============================================================
-- NextNab: customer cancellations (orders + bookings)
-- ============================================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id UUID)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders;
  v_owner UUID;
BEGIN
  SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  IF v_order.user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not allowed to cancel this order';
  END IF;
  IF v_order.status NOT IN ('placed', 'merchant_confirmed') THEN
    RAISE EXCEPTION 'Order can no longer be cancelled';
  END IF;

  -- restore stock for items still linked to a product
  UPDATE public.products p
     SET stock = p.stock + oi.quantity
    FROM public.order_items oi
   WHERE oi.order_id = v_order.id
     AND oi.product_id = p.id;

  -- close any open delivery assignment
  UPDATE public.delivery_assignments
     SET status = 'cancelled'
   WHERE order_id = v_order.id
     AND status NOT IN ('delivered', 'cancelled');

  -- fail any unpaid payment
  UPDATE public.payments
     SET status = 'failed'
   WHERE order_id = v_order.id
     AND status IN ('pending', 'processing');

  UPDATE public.orders
     SET status = 'cancelled',
         cancelled_at = now(),
         updated_at = now()
   WHERE id = v_order.id
  RETURNING * INTO v_order;

  -- let the merchant know
  SELECT owner_id INTO v_owner
    FROM public.stores
   WHERE id = v_order.store_id;
  PERFORM public.notify_user(
    v_owner,
    'Order ' || v_order.order_number || ' was cancelled',
    'The customer cancelled this order.',
    '/merchant'
  );

  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_order(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.cancel_booking(p_booking_id UUID)
RETURNS public.service_bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.service_bookings;
  v_owner UUID;
BEGIN
  SELECT * INTO v_booking FROM public.service_bookings WHERE id = p_booking_id FOR UPDATE;
  IF v_booking.id IS NULL THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;
  IF v_booking.user_id <> auth.uid() AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not allowed to cancel this booking';
  END IF;
  IF v_booking.status NOT IN ('pending', 'confirmed') THEN
    RAISE EXCEPTION 'Booking can no longer be cancelled';
  END IF;

  UPDATE public.payments
     SET status = 'failed'
   WHERE booking_id = v_booking.id
     AND status IN ('pending', 'processing');

  UPDATE public.service_bookings
     SET status = 'cancelled',
         updated_at = now()
   WHERE id = v_booking.id
  RETURNING * INTO v_booking;

  SELECT user_id INTO v_owner
    FROM public.service_providers
   WHERE id = v_booking.provider_id;
  PERFORM public.notify_user(
    v_owner,
    'Booking ' || v_booking.booking_number || ' was cancelled',
    'The customer cancelled this booking.',
    '/provider/'
  );

  RETURN v_booking;
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_booking(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_booking(uuid) TO authenticated, service_role;
