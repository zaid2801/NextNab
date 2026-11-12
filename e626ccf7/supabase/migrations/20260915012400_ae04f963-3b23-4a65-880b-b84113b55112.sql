-- Security definer helpers (bypass RLS => no recursive policy evaluation)
CREATE OR REPLACE FUNCTION public.owns_order(_order_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.orders o WHERE o.id = _order_id AND o.user_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.owns_store(_store_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.stores s WHERE s.id = _store_id AND s.owner_id = _user_id)
$$;

CREATE OR REPLACE FUNCTION public.is_order_rider(_order_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.delivery_assignments d
    JOIN public.riders r ON r.id = d.rider_id
    WHERE d.order_id = _order_id AND r.user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_assignment_rider(_rider_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.riders r WHERE r.id = _rider_id AND r.user_id = _user_id)
$$;

REVOKE EXECUTE ON FUNCTION public.owns_order(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.owns_store(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_order_rider(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_assignment_rider(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.owns_order(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.owns_store(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_order_rider(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_assignment_rider(uuid, uuid) TO authenticated, service_role;

-- ORDERS
DROP POLICY IF EXISTS "orders read" ON public.orders;
DROP POLICY IF EXISTS "orders rider read" ON public.orders;
DROP POLICY IF EXISTS "orders rider update" ON public.orders;
DROP POLICY IF EXISTS "orders update" ON public.orders;

CREATE POLICY "orders read" ON public.orders FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.owns_store(store_id, auth.uid())
  OR public.is_order_rider(id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- customers intentionally excluded: no tampering with totals/status after placing
CREATE POLICY "orders manage update" ON public.orders FOR UPDATE TO authenticated
USING (
  public.owns_store(store_id, auth.uid())
  OR public.is_order_rider(id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.owns_store(store_id, auth.uid())
  OR public.is_order_rider(id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- ORDER ITEMS
DROP POLICY IF EXISTS "order items read" ON public.order_items;
DROP POLICY IF EXISTS "order items insert" ON public.order_items;

CREATE POLICY "order items insert" ON public.order_items FOR INSERT TO authenticated
WITH CHECK (public.owns_order(order_id, auth.uid()));

CREATE POLICY "order items read" ON public.order_items FOR SELECT TO authenticated
USING (
  public.owns_order(order_id, auth.uid())
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND public.owns_store(o.store_id, auth.uid()))
  OR public.is_order_rider(order_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

-- PAYMENTS
DROP POLICY IF EXISTS "own payments" ON public.payments;

CREATE POLICY "payments read" ON public.payments FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "payments insert" ON public.payments FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payments admin update" ON public.payments FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- DELIVERY ASSIGNMENTS (remove direct orders lookup)
DROP POLICY IF EXISTS "delivery read" ON public.delivery_assignments;
DROP POLICY IF EXISTS "delivery rider update" ON public.delivery_assignments;

CREATE POLICY "delivery read" ON public.delivery_assignments FOR SELECT TO authenticated
USING (
  public.is_assignment_rider(rider_id, auth.uid())
  OR public.owns_order(order_id, auth.uid())
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "delivery rider update" ON public.delivery_assignments FOR UPDATE TO authenticated
USING (public.is_assignment_rider(rider_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.is_assignment_rider(rider_id, auth.uid()) OR public.has_role(auth.uid(), 'admin'));