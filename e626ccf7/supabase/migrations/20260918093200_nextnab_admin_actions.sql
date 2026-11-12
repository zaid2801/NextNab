-- ============================================================
-- NextNab: admin operational actions
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_set_order_status(
  p_order_id UUID,
  p_status public.order_status
)
RETURNS public.orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update order status';
  END IF;

  UPDATE public.orders
     SET status = p_status,
         confirmed_at = CASE WHEN p_status = 'merchant_confirmed' THEN now() ELSE confirmed_at END,
         assigned_at = CASE WHEN p_status = 'partner_assigned' THEN now() ELSE assigned_at END,
         out_for_delivery_at = CASE WHEN p_status = 'out_for_delivery' THEN now() ELSE out_for_delivery_at END,
         delivered_at = CASE WHEN p_status = 'delivered' THEN now() ELSE delivered_at END,
         cancelled_at = CASE WHEN p_status = 'cancelled' THEN now() ELSE cancelled_at END,
         updated_at = now()
   WHERE id = p_order_id
  RETURNING * INTO v_order;

  IF v_order.id IS NULL THEN
    RAISE EXCEPTION 'Order not found';
  END IF;
  RETURN v_order;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_order_status(uuid, public.order_status) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_order_status(uuid, public.order_status) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.admin_set_payment_status(
  p_payment_id UUID,
  p_status public.payment_status,
  p_reference TEXT DEFAULT NULL
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment public.payments;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update payments';
  END IF;

  UPDATE public.payments
     SET status = p_status,
         reference = COALESCE(p_reference, reference),
         updated_at = now()
   WHERE id = p_payment_id
  RETURNING * INTO v_payment;

  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;
  RETURN v_payment;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_payment_status(uuid, public.payment_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION admin_set_payment_status(uuid, public.payment_status, text) TO authenticated, service_role;

-- toggle verification / live / online flags on partner tables
CREATE OR REPLACE FUNCTION public.admin_set_partner_flag(
  p_table TEXT,
  p_id UUID,
  p_flag TEXT,
  p_value BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update partner flags';
  END IF;

  IF p_table = 'stores' AND p_flag IN ('is_live', 'is_online') THEN
    UPDATE public.stores SET is_live = CASE WHEN p_flag = 'is_live' THEN p_value ELSE is_live END,
                             is_online = CASE WHEN p_flag = 'is_online' THEN p_value ELSE is_online END,
                             updated_at = now()
     WHERE id = p_id;
  ELSIF p_table = 'service_providers' AND p_flag IN ('is_verified', 'is_online') THEN
    UPDATE public.service_providers SET is_verified = CASE WHEN p_flag = 'is_verified' THEN p_value ELSE is_verified END,
                                        is_online = CASE WHEN p_flag = 'is_online' THEN p_value ELSE is_online END,
                                        updated_at = now()
     WHERE id = p_id;
  ELSIF p_table = 'riders' AND p_flag IN ('is_verified', 'is_online') THEN
    UPDATE public.riders SET is_verified = CASE WHEN p_flag = 'is_verified' THEN p_value ELSE is_verified END,
                             is_online = CASE WHEN p_flag = 'is_online' THEN p_value ELSE is_online END,
                             updated_at = now()
     WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'Unknown table/flag combination';
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Record not found';
  END IF;
  RETURN p_value;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_set_partner_flag(text, uuid, text, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_set_partner_flag(text, uuid, text, boolean) TO authenticated, service_role;
