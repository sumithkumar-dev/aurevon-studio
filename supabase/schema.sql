-- AUREVON — Supabase schema
-- Run this in Supabase Dashboard → SQL Editor → New query → Run

CREATE TABLE IF NOT EXISTS public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  industry TEXT NOT NULL,
  budget TEXT NOT NULL,
  message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- API role grants
GRANT INSERT ON public.contact_submissions TO anon;
GRANT INSERT, SELECT, DELETE ON public.contact_submissions TO authenticated;
GRANT ALL ON public.contact_submissions TO service_role;

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone (anonymous visitor) can submit the contact form
DROP POLICY IF EXISTS "Anyone can submit a contact form" ON public.contact_submissions;
CREATE POLICY "Anyone can submit a contact form"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Any logged-in admin user can read submissions
DROP POLICY IF EXISTS "Authenticated users can read submissions" ON public.contact_submissions;
CREATE POLICY "Authenticated users can read submissions"
  ON public.contact_submissions
  FOR SELECT
  TO authenticated
  USING (true);

-- Any logged-in admin user can delete submissions
DROP POLICY IF EXISTS "Authenticated users can delete submissions" ON public.contact_submissions;
CREATE POLICY "Authenticated users can delete submissions"
  ON public.contact_submissions
  FOR DELETE
  TO authenticated
  USING (true);

-- Helpful index for the admin dashboard ordering
CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx
  ON public.contact_submissions (created_at DESC);
