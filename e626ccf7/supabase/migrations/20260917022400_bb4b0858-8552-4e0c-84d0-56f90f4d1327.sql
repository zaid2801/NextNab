CREATE OR REPLACE FUNCTION public.is_order_store_owner(_order_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.orders o
    JOIN public.stores s ON s.id = o.store_id
    WHERE o.id = _order_id AND s.owner_id = _user_id
  )
$$;
REVOKE ALL ON FUNCTION public.is_order_store_owner(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_order_store_owner(uuid, uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS "delivery read" ON public.delivery_assignments;
CREATE POLICY "delivery read" ON public.delivery_assignments
FOR SELECT TO authenticated
USING (
  public.is_assignment_rider(rider_id, auth.uid())
  OR public.owns_order(order_id, auth.uid())
  OR public.is_order_store_owner(order_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);