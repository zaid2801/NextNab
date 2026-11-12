-- place_order inserted a text CASE expression into payments.status, which is a
-- payment_status enum; Postgres has no implicit text->enum cast, so every order
-- failed with "column \"status\" is of type payment_status but expression is of
-- type text". Cast the branches explicitly.
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
       CASE WHEN _method = 'cod' THEN 'pending'::public.payment_status
            ELSE 'success'::public.payment_status END,
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
