-- Job listings for the B2B recruiter portal (post-a-role)
-- Paid via Stripe one-time payment; no RLS needed (admin manages via service role)

CREATE TABLE IF NOT EXISTS public.job_listings (
  id                uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  company           text        NOT NULL,
  logo_url          text,
  title             text        NOT NULL,
  location          text        NOT NULL CHECK (location IN ('Sydney','Melbourne','Brisbane','Remote','Hybrid')),
  job_type          text        NOT NULL CHECK (job_type IN ('Full-time','Contract','Graduate')),
  description       text        NOT NULL,
  apply_url         text        NOT NULL,
  salary            text,
  contact_email     text        NOT NULL,
  status            text        NOT NULL DEFAULT 'active' CHECK (status IN ('pending','active','expired')),
  stripe_session_id text,
  posted_at         timestamptz NOT NULL DEFAULT now(),
  expires_at        timestamptz NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_listings_status_expires_idx
  ON public.job_listings (status, expires_at);
