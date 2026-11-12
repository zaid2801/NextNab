-- ========== ROLES ==========
CREATE TYPE public.app_role AS ENUM ('customer','shopkeeper','service_provider','rider','admin');
CREATE TYPE public.order_status AS ENUM ('placed','merchant_confirmed','partner_assigned','out_for_delivery','delivered','cancelled');
CREATE TYPE public.payment_status AS ENUM ('pending','processing','success','failed');
CREATE TYPE public.payment_method AS ENUM ('upi','card','cod');
CREATE TYPE public.booking_status AS ENUM ('pending','confirmed','in_progress','completed','cancelled');
CREATE TYPE public.application_status AS ENUM ('draft','submitted','under_review','approved','rejected');
CREATE TYPE public.partner_type AS ENUM ('shopkeeper','service_provider','rider');

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql SET search_path = public;

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT, INSERT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "own roles read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "own role insert" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND role <> 'admin');

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'customer'))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== LOCATIONS ==========
CREATE TABLE public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city TEXT NOT NULL,
  state_code TEXT NOT NULL DEFAULT 'MH',
  area TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.locations TO anon, authenticated;
GRANT ALL ON public.locations TO service_role;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations public read" ON public.locations FOR SELECT USING (true);
CREATE POLICY "locations admin write" ON public.locations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  label TEXT NOT NULL DEFAULT 'Home',
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  line1 TEXT NOT NULL,
  line2 TEXT,
  city TEXT NOT NULL DEFAULT 'Latur',
  state TEXT NOT NULL DEFAULT 'Maharashtra',
  pincode TEXT NOT NULL DEFAULT '413512',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own addresses" ON public.addresses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER addresses_updated BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== STORES & PRODUCTS ==========
CREATE TABLE public.store_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.store_categories TO anon, authenticated;
GRANT ALL ON public.store_categories TO service_role;
ALTER TABLE public.store_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "store cats public read" ON public.store_categories FOR SELECT USING (true);

CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users ON DELETE SET NULL,
  name TEXT NOT NULL,
  owner_name TEXT,
  category_id UUID REFERENCES public.store_categories(id),
  gstin TEXT,
  address TEXT,
  city TEXT NOT NULL DEFAULT 'Latur',
  image_url TEXT,
  opening_time TEXT,
  closing_time TEXT,
  open_days TEXT[] NOT NULL DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
  min_order_value NUMERIC(10,2) DEFAULT 0,
  packaging_charge NUMERIC(10,2) DEFAULT 0,
  is_online BOOLEAN NOT NULL DEFAULT true,
  is_live BOOLEAN NOT NULL DEFAULT true,
  rating NUMERIC(2,1) DEFAULT 4.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stores TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT ALL ON public.stores TO service_role;
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stores public read" ON public.stores FOR SELECT USING (is_live OR auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "stores owner write" ON public.stores FOR INSERT TO authenticated WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "stores owner update" ON public.stores FOR UPDATE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "stores owner delete" ON public.stores FOR DELETE TO authenticated USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER stores_updated BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.product_categories TO anon, authenticated;
GRANT ALL ON public.product_categories TO service_role;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "product cats public read" ON public.product_categories FOR SELECT USING (true);

CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.product_categories(id),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  brand TEXT,
  sku TEXT,
  unit TEXT NOT NULL DEFAULT '1 pc',
  mrp NUMERIC(10,2) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  image_url TEXT,
  short_description TEXT,
  description TEXT,
  shelf_life TEXT,
  storage_info TEXT,
  fssai_license TEXT,
  stock INT NOT NULL DEFAULT 0,
  is_live BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products public read" ON public.products FOR SELECT USING (is_live OR public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.owner_id = auth.uid()));
CREATE POLICY "products owner manage" ON public.products FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.owner_id = auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = products.store_id AND s.owner_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER products_updated BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== CART ==========
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.carts TO authenticated;
GRANT ALL ON public.carts TO service_role;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart" ON public.carts FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.cart_items TO authenticated;
GRANT ALL ON public.cart_items TO service_role;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own cart items" ON public.cart_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.carts c WHERE c.id = cart_items.cart_id AND c.user_id = auth.uid()));
CREATE TRIGGER cart_items_updated BEFORE UPDATE ON public.cart_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== ORDERS ==========
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  delivery_address TEXT,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  taxes NUMERIC(10,2) NOT NULL DEFAULT 0,
  discount NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'placed',
  placed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMPTZ,
  assigned_at TIMESTAMPTZ,
  out_for_delivery_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  eta_minutes INT NOT NULL DEFAULT 20,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "orders read" ON public.orders FOR SELECT TO authenticated USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.owner_id = auth.uid())
  OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "orders customer insert" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "orders update" ON public.orders FOR UPDATE TO authenticated USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.owner_id = auth.uid())
  OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER orders_updated BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  unit TEXT,
  unit_price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL,
  line_total NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT ALL ON public.order_items TO service_role;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "order items read" ON public.order_items FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND (
    o.user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.stores s WHERE s.id = o.store_id AND s.owner_id = auth.uid())
    OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "order items insert" ON public.order_items FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_items.order_id AND o.user_id = auth.uid()));

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  booking_id UUID,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  method public.payment_method NOT NULL DEFAULT 'upi',
  status public.payment_status NOT NULL DEFAULT 'pending',
  upi_id TEXT,
  reference TEXT,
  is_test BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own payments" ON public.payments FOR ALL TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER payments_updated BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== SERVICES ==========
CREATE TABLE public.service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_categories TO anon, authenticated;
GRANT ALL ON public.service_categories TO service_role;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service cats public read" ON public.service_categories FOR SELECT USING (true);

CREATE TABLE public.service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  category_id UUID REFERENCES public.service_categories(id),
  headline TEXT,
  bio TEXT,
  avatar_url TEXT,
  experience_years INT NOT NULL DEFAULT 0,
  jobs_done INT NOT NULL DEFAULT 0,
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  base_visit_fee NUMERIC(10,2) DEFAULT 99,
  hourly_rate NUMERIC(10,2),
  service_areas TEXT[] NOT NULL DEFAULT '{}',
  available_days TEXT[] NOT NULL DEFAULT ARRAY['Mon','Tue','Wed','Thu','Fri','Sat'],
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_online BOOLEAN NOT NULL DEFAULT true,
  city TEXT NOT NULL DEFAULT 'Latur',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_providers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_providers TO authenticated;
GRANT ALL ON public.service_providers TO service_role;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "providers public read" ON public.service_providers FOR SELECT USING (is_verified OR auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "providers own manage" ON public.service_providers FOR ALL TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER providers_updated BEFORE UPDATE ON public.service_providers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.service_categories(id),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10,2) NOT NULL,
  duration TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services public read" ON public.services FOR SELECT USING (is_active OR public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.service_providers p WHERE p.id = services.provider_id AND p.user_id = auth.uid()));
CREATE POLICY "services owner manage" ON public.services FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.service_providers p WHERE p.id = services.provider_id AND p.user_id = auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.service_providers p WHERE p.id = services.provider_id AND p.user_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER services_updated BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.service_providers(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name TEXT NOT NULL,
  address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  service_address TEXT,
  scheduled_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  visiting_fee NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount NUMERIC(10,2) NOT NULL,
  payment_method public.payment_method NOT NULL DEFAULT 'upi',
  status public.booking_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.service_bookings TO authenticated;
GRANT ALL ON public.service_bookings TO service_role;
ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings read" ON public.service_bookings FOR SELECT TO authenticated USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.service_providers p WHERE p.id = service_bookings.provider_id AND p.user_id = auth.uid())
  OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "bookings customer insert" ON public.service_bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookings update" ON public.service_bookings FOR UPDATE TO authenticated USING (
  auth.uid() = user_id
  OR EXISTS (SELECT 1 FROM public.service_providers p WHERE p.id = service_bookings.provider_id AND p.user_id = auth.uid())
  OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER bookings_updated BEFORE UPDATE ON public.service_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== RIDERS ==========
CREATE TABLE public.riders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users ON DELETE CASCADE,
  rider_code TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  vehicle_type TEXT NOT NULL DEFAULT 'Bike',
  vehicle_number TEXT,
  license_number TEXT,
  hub TEXT NOT NULL DEFAULT 'Latur Hub',
  is_online BOOLEAN NOT NULL DEFAULT false,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  rating NUMERIC(2,1) NOT NULL DEFAULT 5.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.riders TO authenticated;
GRANT ALL ON public.riders TO service_role;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "riders own" ON public.riders FOR ALL TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER riders_updated BEFORE UPDATE ON public.riders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rider_id UUID REFERENCES public.riders(id) ON DELETE SET NULL,
  pickup_location TEXT,
  drop_location TEXT,
  distance_km NUMERIC(5,2),
  earnings NUMERIC(10,2) DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'partner_assigned',
  accepted_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.delivery_assignments TO authenticated;
GRANT ALL ON public.delivery_assignments TO service_role;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delivery read" ON public.delivery_assignments FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.riders r WHERE r.id = delivery_assignments.rider_id AND r.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM public.orders o WHERE o.id = delivery_assignments.order_id AND o.user_id = auth.uid())
  OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "delivery rider update" ON public.delivery_assignments FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.riders r WHERE r.id = delivery_assignments.rider_id AND r.user_id = auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "delivery admin insert" ON public.delivery_assignments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER delivery_updated BEFORE UPDATE ON public.delivery_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- rider access to their assigned orders (added after delivery_assignments exists)
CREATE POLICY "orders rider read" ON public.orders FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.delivery_assignments d JOIN public.riders r ON r.id = d.rider_id WHERE d.order_id = orders.id AND r.user_id = auth.uid()));
CREATE POLICY "orders rider update" ON public.orders FOR UPDATE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.delivery_assignments d JOIN public.riders r ON r.id = d.rider_id WHERE d.order_id = orders.id AND r.user_id = auth.uid()));

-- ========== PARTNER APPLICATIONS ==========
CREATE TABLE public.partner_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  partner_type public.partner_type NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  referral_code TEXT,
  business_name TEXT,
  business_category TEXT,
  gstin TEXT,
  business_address TEXT,
  city TEXT NOT NULL DEFAULT 'Latur',
  service_category TEXT,
  experience TEXT,
  service_areas TEXT[],
  base_visit_fee NUMERIC(10,2),
  hourly_rate NUMERIC(10,2),
  skills TEXT,
  vehicle_type TEXT,
  vehicle_number TEXT,
  license_number TEXT,
  id_type TEXT,
  id_number TEXT,
  id_front_url TEXT,
  id_back_url TEXT,
  business_proof_url TEXT,
  certificate_url TEXT,
  bank_account_name TEXT,
  bank_account_number TEXT,
  bank_ifsc TEXT,
  status public.application_status NOT NULL DEFAULT 'draft',
  current_step INT NOT NULL DEFAULT 1,
  submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.partner_applications TO authenticated;
GRANT ALL ON public.partner_applications TO service_role;
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own application" ON public.partner_applications FOR ALL TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER partner_apps_updated BEFORE UPDATE ON public.partner_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========== REVIEWS ==========
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_area TEXT,
  provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE,
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  rating NUMERIC(2,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_featured BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews own write" ON public.reviews FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews own update" ON public.reviews FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews own delete" ON public.reviews FOR DELETE TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- ========== SEED ==========
INSERT INTO public.locations (city, state_code, area) VALUES
 ('Latur','MH','Ganj Golai'),('Latur','MH','MIDC'),('Latur','MH','Shivaji Nagar'),
 ('Latur','MH','Ausa Road'),('Latur','MH','Khardegaon'),('Latur','MH','Awa Nagar');

INSERT INTO public.store_categories (name, slug, icon) VALUES
 ('Grocery & Essentials','grocery','storefront'),
 ('Pharmacy & Medicines','pharmacy','medication'),
 ('Bakery & Sweets','bakery','bakery_dining'),
 ('Electronics & Accessories','electronics','devices');

INSERT INTO public.product_categories (name, slug, icon, sort_order) VALUES
 ('Fruits & Veg','fruits-veg','nutrition',1),
 ('Dairy','dairy','egg_alt',2),
 ('Snacks','snacks','cookie',3),
 ('Household','household','cleaning_services',4),
 ('Personal Care','personal-care','face_retouching_natural',5),
 ('Beverages','beverages','local_cafe',6),
 ('Pulses & Dal','pulses-dal','grain',7);

INSERT INTO public.stores (name, owner_name, category_id, address, opening_time, closing_time, min_order_value, rating)
VALUES ('Latur Fresh Mart','Amit Deshmukh',(SELECT id FROM public.store_categories WHERE slug='grocery'),'Shivaji Chowk, Latur','08:00','22:00',150,4.8);

INSERT INTO public.products (store_id, category_id, name, slug, brand, sku, unit, mrp, price, short_description, description, shelf_life, storage_info, fssai_license, stock)
SELECT s.id, (SELECT id FROM public.product_categories WHERE slug='pulses-dal'),'Organic Toor Dal Premium (Unpolished)','organic-toor-dal-premium','NextNab Essentials','DAL-TOOR-1KG','1 kg',180,135,
 'Sourced directly from organic farms in Maharashtra. Protein-rich, unpolished, and no added preservatives.',
 'NextNab Essentials Toor Dal is carefully selected to ensure the highest quality and authentic taste. Perfect for daily meals, it cooks quickly and delivers a wholesome, nutty flavor to your favorite recipes.',
 '6 Months','Store in a cool, dry place. Transfer to an airtight container after opening.','10019022009346',120 FROM public.stores s WHERE s.name='Latur Fresh Mart';

INSERT INTO public.products (store_id, category_id, name, slug, brand, sku, unit, mrp, price, short_description, stock)
SELECT s.id, pc.id, v.name, v.slug, v.brand, v.sku, v.unit, v.mrp, v.price, v.descr, v.stock
FROM public.stores s
JOIN (VALUES
 ('SunPure Refined Sunflower Oil','sunpure-refined-sunflower-oil','SunPure','OIL-SUN-5L','5 Litre',750,637,'household','Light and healthy refined sunflower oil for everyday cooking.',60),
 ('Fresh Hybrid Tomatoes','fresh-hybrid-tomatoes','Farm Fresh','TOM-HYB-500G','500 g',40,36,'fruits-veg','Locally sourced ripe hybrid tomatoes.',200),
 ('Farm Fresh Brown Eggs','farm-fresh-brown-eggs','Farm Fresh','EGG-BRN-12','12 Pieces',120,96,'dairy','Protein-rich brown eggs from local farms.',80),
 ('Fresh Toned Milk','fresh-toned-milk','Amul','MLK-TND-500','500 ml',30,28,'dairy','Daily fresh toned milk, pasteurised.',150),
 ('Premium Basmati Rice','premium-basmati-rice','India Gate','RIC-BAS-5KG','5 kg',500,450,'household','Long grain aged basmati rice.',45),
 ('Sunflower Oil','fortune-sunflower-oil','Fortune','OIL-SUN-1L','1 L',160,145,'household','Fortune Sunlite refined sunflower oil.',90),
 ('Turmeric Powder','turmeric-powder','Everest','SPC-TUR-250','250 g',60,55,'household','Pure ground turmeric powder.',110),
 ('Organic Red Tomatoes','organic-red-tomatoes','Organic Farms','TOM-ORG-001','1 kg',75,65,'fruits-veg','Certified organic red tomatoes.',145),
 ('Full Cream Milk','full-cream-milk-1l','Amul','MLK-FC-1L','1 L',70,66,'dairy','Rich full cream milk.',12),
 ('Whole Wheat Bread','whole-wheat-bread','Britannia','BRD-WW-400G','400 g',55,50,'snacks','Soft whole wheat sandwich bread.',0),
 ('Aashirvaad Select Premium Sharbati Atta','aashirvaad-sharbati-atta','Aashirvaad','ATA-SHB-5KG','5 kg',320,285,'household','Premium sharbati wheat atta.',70),
 ('Masala Potato Chips','masala-potato-chips','Lays','SNK-CHP-100','100 g',30,27,'snacks','Crispy masala flavoured potato chips.',180),
 ('Filter Coffee Powder','filter-coffee-powder','Bru','BEV-COF-200','200 g',245,219,'beverages','Aromatic South Indian filter coffee blend.',60),
 ('Herbal Face Wash','herbal-face-wash','Himalaya','PC-FW-150','150 ml',180,159,'personal-care','Gentle neem herbal face wash.',75),
 ('Dishwash Gel','dishwash-gel','Vim','HH-DW-750','750 ml',199,175,'household','Lemon dishwash gel, tough on grease.',95)
) AS v(name,slug,brand,sku,unit,mrp,price,cat,descr,stock) ON true
JOIN public.product_categories pc ON pc.slug = v.cat
WHERE s.name='Latur Fresh Mart';

INSERT INTO public.service_categories (name, slug, icon, sort_order) VALUES
 ('Electrician','electrician','electric_bolt',1),
 ('Plumber','plumber','plumbing',2),
 ('AC Repair','ac-repair','ac_unit',3),
 ('Salon at Home','salon','spa',4),
 ('Cleaning','cleaning','cleaning_services',5),
 ('Carpentry','carpentry','carpenter',6),
 ('Painting','painting','format_paint',7);

INSERT INTO public.service_providers (full_name, slug, category_id, headline, bio, experience_years, jobs_done, rating, base_visit_fee, service_areas, is_verified)
SELECT v.name, v.slug, sc.id, v.headline, v.bio, v.exp, v.jobs, v.rating, 99, ARRAY['Ganj Golai','MIDC','Shivaji Nagar','Ausa Road'], true
FROM (VALUES
 ('Rajesh K.','rajesh-k','electrician','Master Electrician','Licensed electrician handling wiring, fittings and emergency repairs across Latur.',8,420,4.9),
 ('Priya S.','priya-s','salon','Senior Stylist','Hygienic at-home salon services including hair, skin and bridal packages.',5,260,4.8),
 ('Vikram M.','vikram-m','plumber','Expert Plumber','Leak fixing, pipeline installation and bathroom fittings specialist.',12,610,4.7),
 ('Amit P.','amit-p','ac-repair','AC Specialist & HVAC Expert','AC deep cleaning, gas refills and full HVAC diagnostics.',6,300,5.0)
) AS v(name,slug,cat,headline,bio,exp,jobs,rating)
JOIN public.service_categories sc ON sc.slug = v.cat;

INSERT INTO public.services (provider_id, category_id, name, description, price, duration)
SELECT p.id, p.category_id, v.name, v.descr, v.price, v.dur
FROM public.service_providers p
JOIN (VALUES
 ('amit-p','AC Deep Cleaning','Complete indoor and outdoor unit cleaning using specialized foam and pressure wash.',499,'45 mins'),
 ('amit-p','Gas Refill & Leak Fix','R32/R410A gas top-up, comprehensive leak detection, and brazing if required.',1500,'60-90 mins'),
 ('amit-p','General Checkup','Basic inspection of cooling efficiency, filter check, and noise diagnosis. (Fee waived if service booked).',200,'30 mins'),
 ('rajesh-k','Wiring & Switchboard Repair','Fault finding and repair of switchboards, sockets and internal wiring.',350,'60 mins'),
 ('rajesh-k','Fan / Light Installation','Installation of ceiling fans, tube lights and decorative fixtures.',250,'45 mins'),
 ('vikram-m','Pipe Leak Fix','Detection and sealing of leaking pipes and joints.',400,'45 mins'),
 ('vikram-m','Bathroom Fittings Installation','Installation of taps, showers, and sanitary fittings.',600,'90 mins'),
 ('priya-s','Haircut & Styling at Home','Professional haircut and blow-dry styling at your home.',450,'60 mins'),
 ('priya-s','Bridal Makeup Package','Complete bridal makeup with hygienic professional products.',4500,'180 mins')
) AS v(pslug,name,descr,price,dur) ON v.pslug = p.slug;

INSERT INTO public.reviews (author_name, author_area, provider_id, rating, comment, is_featured)
SELECT v.author, v.area, p.id, v.rating, v.comment, true
FROM (VALUES
 ('Sanjay D.','Ausa Road, Latur','amit-p',5.0,'The AC technician arrived within 30 minutes. Found the issue quickly and fixed it at a very reasonable price. Highly recommend NextNab!'),
 ('Meera R.','Shivaji Nagar, Latur','priya-s',4.5,'Booked salon services for my sister''s wedding. The stylist was very professional and hygienic. Saved us so much time.'),
 ('Kiran P.','MIDC, Latur','vikram-m',5.0,'Had a major plumbing leak late evening. NextNab pro was a lifesaver. Upfront pricing meant no haggling. Great service.')
) AS v(author,area,pslug,rating,comment)
JOIN public.service_providers p ON p.slug = v.pslug;