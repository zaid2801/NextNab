-- ============================================================
-- NextNab: first-party email OTP codes
-- Codes are generated server-side and emailed through Resend, so
-- the 6-digit flow no longer depends on Supabase's email templates
-- (which ship without {{ .Token }}) or its rate-limited mailer.
-- Only service_role may read or write this table.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.email_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  purpose TEXT NOT NULL CHECK (purpose IN ('signup','email')),
  code_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  consumed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS email_otps_email_idx
  ON public.email_otps (email, purpose, created_at DESC);

ALTER TABLE public.email_otps ENABLE ROW LEVEL SECURITY;
-- Intentionally no policies: service_role bypasses RLS and every
-- other role (anon, authenticated) is denied by default.
