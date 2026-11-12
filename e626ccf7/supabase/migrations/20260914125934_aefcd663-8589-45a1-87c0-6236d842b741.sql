
ALTER TABLE public.partner_applications
  ADD COLUMN IF NOT EXISTS review_note text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

CREATE OR REPLACE FUNCTION public.review_partner_application(
  _app_id uuid,
  _decision application_status,
  _note text DEFAULT NULL
)
RETURNS public.partner_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  app public.partner_applications;
  new_slug text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can review applications';
  END IF;
  IF _decision NOT IN ('under_review', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;

  UPDATE public.partner_applications
     SET status = _decision,
         review_note = _note,
         reviewed_at = now(),
         reviewed_by = auth.uid(),
         updated_at = now()
   WHERE id = _app_id
  RETURNING * INTO app;

  IF app.id IS NULL THEN
    RAISE EXCEPTION 'Application not found';
  END IF;

  IF _decision = 'approved' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (app.user_id, app.partner_type::text::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF app.partner_type = 'shopkeeper' THEN
      IF NOT EXISTS (SELECT 1 FROM public.stores WHERE owner_id = app.user_id) THEN
        INSERT INTO public.stores (owner_id, name, city, is_online, is_live)
        VALUES (app.user_id, COALESCE(app.business_name, app.full_name), app.city, false, false);
      END IF;
    ELSIF app.partner_type = 'service_provider' THEN
      IF NOT EXISTS (SELECT 1 FROM public.service_providers WHERE user_id = app.user_id) THEN
        new_slug := regexp_replace(lower(app.full_name), '[^a-z0-9]+', '-', 'g') || '-' || substr(app.user_id::text, 1, 6);
        INSERT INTO public.service_providers (user_id, full_name, slug, city, is_verified, is_online)
        VALUES (app.user_id, app.full_name, new_slug, app.city, true, false);
      END IF;
    ELSIF app.partner_type = 'rider' THEN
      IF NOT EXISTS (SELECT 1 FROM public.riders WHERE user_id = app.user_id) THEN
        INSERT INTO public.riders (user_id, rider_code, full_name, vehicle_type, is_verified, is_online)
        VALUES (app.user_id, 'NN-' || upper(substr(replace(app.user_id::text, '-', ''), 1, 6)),
                app.full_name, COALESCE(app.vehicle_type, 'Bike'), true, false);
      END IF;
    END IF;
  END IF;

  RETURN app;
END;
$$;

REVOKE ALL ON FUNCTION public.review_partner_application(uuid, application_status, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_partner_application(uuid, application_status, text) TO authenticated, service_role;