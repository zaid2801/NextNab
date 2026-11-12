-- ============================================================
-- NextNab marketplace extensions
-- wishlist, store slug/geo, location geo, atomic order creation,
-- realtime publication, review guard, admin reads, product images
-- ============================================================

-- ========== WISHLIST ==========
CREATE TABLE IF NOT EXISTS public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, product_id)
);
CREATE INDEX IF NOT EXISTS wishlists_user_idx ON public.wishlists (user_id);
CREATE INDEX IF NOT EXISTS wishlists_product_idx ON public.wishlists (product_id);
GRANT SELECT, INSERT, DELETE ON public.wishlists TO authenticated;
GRANT ALL ON public.wishlists TO service_role;
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own wishlist read" ON public.wishlists FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own wishlist insert" ON public.wishlists FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own wishlist delete" ON public.wishlists FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ========== LOCATION GEO ==========
ALTER TABLE public.locations
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

UPDATE public.locations SET latitude = 18.3949, longitude = 76.5850 WHERE area = 'Ganj Golai' AND latitude IS NULL;
UPDATE public.locations SET latitude = 18.4108, longitude = 76.5544 WHERE area = 'MIDC' AND latitude IS NULL;
UPDATE public.locations SET latitude = 18.3867, longitude = 76.5731 WHERE area = 'Shivaji Nagar' AND latitude IS NULL;
UPDATE public.locations SET latitude = 18.3736, longitude = 76.5869 WHERE area = 'Ausa Road' AND latitude IS NULL;
UPDATE public.locations SET latitude = 18.4230, longitude = 76.5980 WHERE area = 'Khardegaon' AND latitude IS NULL;
UPDATE public.locations SET latitude = 18.4025, longitude = 76.6010 WHERE area = 'Awa Nagar' AND latitude IS NULL;

-- ========== STORE SLUG + GEO ==========
ALTER TABLE public.stores
  ADD COLUMN IF NOT EXISTS slug TEXT,
  ADD COLUMN IF NOT EXISTS area_id UUID REFERENCES public.locations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

CREATE OR REPLACE FUNCTION public.slugify(_text text)
RETURNS TEXT LANGUAGE sql IMMUTABLE AS $$
  SELECT trim(both '-' FROM regexp_replace(lower(coalesce(_text, '')), '[^a-z0-9]+', '-', 'g'))
$$;

CREATE OR REPLACE FUNCTION public.set_store_slug()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  base text;
  candidate text;
  suffix int := 1;
BEGIN
  base := public.slugify(NEW.slug);
  IF base = '' THEN base := public.slugify(NEW.name); END IF;
  IF base = '' THEN base := 'store'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.stores s WHERE s.slug = candidate AND s.id IS DISTINCT FROM NEW.id) LOOP
    suffix := suffix + 1;
    candidate := base || '-' || suffix;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS stores_slug ON public.stores;
CREATE TRIGGER stores_slug BEFORE INSERT OR UPDATE OF name, slug ON public.stores
  FOR EACH ROW EXECUTE FUNCTION public.set_store_slug();

UPDATE public.stores SET slug = name WHERE slug IS NULL OR trim(slug) = '';
UPDATE public.stores
   SET area_id = (SELECT id FROM public.locations WHERE area = 'Shivaji Nagar' LIMIT 1),
       latitude = 18.3880,
       longitude = 76.5760
 WHERE latitude IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS stores_slug_key ON public.stores (slug);
CREATE INDEX IF NOT EXISTS stores_area_idx ON public.stores (area_id);

-- ========== PRODUCT SLUGS (auto) ==========
CREATE OR REPLACE FUNCTION public.set_product_slug()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
DECLARE
  base text;
  candidate text;
  suffix int := 1;
BEGIN
  base := public.slugify(NEW.slug);
  IF base = '' THEN base := public.slugify(NEW.name); END IF;
  IF base = '' THEN base := 'product'; END IF;
  candidate := base;
  WHILE EXISTS (SELECT 1 FROM public.products p WHERE p.slug = candidate AND p.id IS DISTINCT FROM NEW.id) LOOP
    suffix := suffix + 1;
    candidate := base || '-' || suffix;
  END LOOP;
  NEW.slug := candidate;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS products_slug ON public.products;
CREATE TRIGGER products_slug BEFORE INSERT OR UPDATE OF name, slug ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_product_slug();

-- ========== ORDER NUMBERS ==========
CREATE SEQUENCE IF NOT EXISTS public.order_number_seq START 10001;

-- ========== ATOMIC ORDER CREATION ==========
-- Mirrors src/lib/cart-math.ts: free delivery >= 199, else 40; taxes 5%.
CREATE OR REPLACE FUNCTION public.place_order(
  _address_id uuid,
  _delivery_address text,
  _method public.payment_method,
  _upi_id text DEFAULT NULL,
  _cod_fee numeric DEFAULT 0,
  _items jsonb DEFAULT '[]'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  addr public.addresses;
  item jsonb;
  prod public.products;
  qty int;
  validated jsonb := '[]'::jsonb;
  store_group jsonb;
  store_id uuid;
  subtotal numeric;
  delivery numeric;
  taxes numeric;
  total numeric;
  new_order public.orders;
  results jsonb := '[]'::jsonb;
  rows int;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'You must be signed in to place an order';
  END IF;

  SELECT * INTO addr FROM public.addresses WHERE id = _address_id AND user_id = uid;
  IF addr.id IS NULL THEN
    RAISE EXCEPTION 'Delivery address not found';
  END IF;

  IF jsonb_typeof(_items) <> 'array' OR jsonb_array_length(_items) = 0 THEN
    RAISE EXCEPTION 'Your cart is empty';
  END IF;

  FOR item IN SELECT * FROM jsonb_array_elements(_items)
  LOOP
    qty := coalesce((item->>'quantity')::int, 0);
    IF qty <= 0 THEN
      RAISE EXCEPTION 'Invalid quantity in cart';
    END IF;
    SELECT * INTO prod FROM public.products WHERE id = (item->>'product_id')::uuid;
    IF prod.id IS NULL OR NOT prod.is_live THEN
      RAISE EXCEPTION 'A product in your cart is no longer available';
    END IF;
    IF prod.store_id IS NULL THEN
      RAISE EXCEPTION 'A product in your cart has no store';
    END IF;
    IF prod.stock < qty THEN
      RAISE EXCEPTION 'Insufficient stock for %', prod.name;
    END IF;
    validated := validated || jsonb_build_object(
      'product_id', prod.id,
      'store_id', prod.store_id,
      'name', prod.name,
      'unit', prod.unit,
      'unit_price', prod.price,
      'quantity', qty
    );
  END LOOP;

  FOR store_id IN SELECT DISTINCT (v->>'store_id')::uuid FROM jsonb_array_elements(validated) v
  LOOP
    store_group := (
      SELECT jsonb_agg(v) FROM jsonb_array_elements(validated) v
      WHERE (v->>'store_id')::uuid = store_id
    );

    subtotal := (
      SELECT round(sum((v->>'unit_price')::numeric * (v->>'quantity')::int) * 100) / 100
      FROM jsonb_array_elements(store_group) v
    );
    delivery := CASE WHEN subtotal >= 199 THEN 0 ELSE 40 END;
    taxes := round(subtotal * 0.05 * 100) / 100;
    total := round((subtotal + delivery + taxes + _cod_fee) * 100) / 100;

    INSERT INTO public.orders
      (order_number, user_id, store_id, address_id, delivery_address,
       subtotal, delivery_fee, taxes, discount, cod_fee, total, status, eta_minutes)
    VALUES
      ('NN-' || nextval('public.order_number_seq'), uid, store_id, _address_id, _delivery_address,
       subtotal, delivery, taxes, 0, _cod_fee, total, 'placed', 20)
    RETURNING * INTO new_order;

    INSERT INTO public.order_items
      (order_id, product_id, product_name, unit, unit_price, quantity, line_total)
    SELECT
      new_order.id,
      (v->>'product_id')::uuid,
      v->>'name',
      v->>'unit',
      (v->>'unit_price')::numeric,
      (v->>'quantity')::int,
      round((v->>'unit_price')::numeric * (v->>'quantity')::int * 100) / 100
    FROM jsonb_array_elements(store_group) v;

    INSERT INTO public.payments
      (order_id, user_id, amount, method, status, upi_id, reference, is_test)
    VALUES
      (new_order.id, uid, total, _method,
       CASE WHEN _method = 'cod' THEN 'pending' ELSE 'success' END,
       _upi_id, 'TXN' || extract(epoch FROM now())::bigint, true);

    FOR item IN SELECT * FROM jsonb_array_elements(store_group)
    LOOP
      UPDATE public.products
         SET stock = stock - (item->>'quantity')::int, updated_at = now()
       WHERE id = (item->>'product_id')::uuid AND stock >= (item->>'quantity')::int;
      GET DIAGNOSTICS rows = ROW_COUNT;
      IF rows = 0 THEN
        RAISE EXCEPTION 'Insufficient stock for %', item->>'name';
      END IF;
    END LOOP;

    results := results || jsonb_build_object(
      'id', new_order.id,
      'order_number', new_order.order_number,
      'store_id', store_id,
      'total', total
    );
  END LOOP;

  DELETE FROM public.cart_items
   WHERE cart_id = (SELECT id FROM public.carts WHERE user_id = uid)
     AND product_id IN (SELECT (v->>'product_id')::uuid FROM jsonb_array_elements(validated) v);

  RETURN results;
END;
$$;

REVOKE ALL ON FUNCTION public.place_order(uuid, text, public.payment_method, text, numeric, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(uuid, text, public.payment_method, text, numeric, jsonb) TO authenticated, service_role;

-- ========== REALTIME ==========
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_assignments;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.service_bookings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- ========== REVIEW GUARD ==========
DROP POLICY IF EXISTS "reviews own write" ON public.reviews;
CREATE POLICY "reviews own write" ON public.reviews FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = user_id
  AND (
    order_id IS NULL
    OR (
      public.owns_order(order_id, auth.uid())
      AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.status = 'delivered')
    )
  )
);

-- ========== ADMIN READS ==========
CREATE POLICY "admin profiles read" ON public.profiles FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ========== PRODUCT IMAGE STORAGE ==========
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "product images public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');
CREATE POLICY "product images owner upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product-images' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "product images owner update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
CREATE POLICY "product images owner delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND ((storage.foldername(name))[1] = auth.uid()::text OR public.has_role(auth.uid(), 'admin')));
