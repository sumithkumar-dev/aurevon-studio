-- ============================================================
-- AUREVON CRM — Supabase fix script
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. Ensure the clients table exists with ALL required columns
-- (safe to run even if the table already exists)
CREATE TABLE IF NOT EXISTS clients (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id               uuid REFERENCES contact_submissions(id) ON DELETE SET NULL,
  client_name           text NOT NULL DEFAULT '',
  business_name         text NOT NULL DEFAULT '',
  phone                 text NOT NULL DEFAULT '',
  email                 text NOT NULL DEFAULT '',
  industry              text NOT NULL DEFAULT '',
  source                text NOT NULL DEFAULT 'Website',
  final_budget          text,
  quoted_price          numeric,
  final_price           numeric,
  advance_paid          numeric NOT NULL DEFAULT 0,
  remaining_amount      numeric NOT NULL DEFAULT 0,
  project_status        text NOT NULL DEFAULT 'Advance Pending',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now(),
  project_name          text,
  project_type          text,
  project_description   text,
  scope_of_work         text,
  timeline              text,
  delivery_date         date,
  owner_name            text,
  business_address      text,
  gst_number            text,
  business_website      text,
  business_email        text,
  advance_amount        numeric,
  payment_status        text NOT NULL DEFAULT 'Not Started',
  agreement_date        date,
  project_start_date    date,
  project_end_date      date,
  revision_count        int NOT NULL DEFAULT 0,
  terms_notes           text,
  primary_contact_name  text,
  primary_contact_phone text,
  primary_contact_email text
);

-- 2. Add any missing columns to an existing clients table
-- (each ALTER is safe to run multiple times — IF NOT EXISTS guards it)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS terms_notes           text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS remaining_amount      numeric NOT NULL DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS project_name          text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS project_type          text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS project_description   text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS scope_of_work         text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS timeline              text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS delivery_date         date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS owner_name            text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_address      text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS gst_number            text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_website      text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS business_email        text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS advance_amount        numeric;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS payment_status        text NOT NULL DEFAULT 'Not Started';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS agreement_date        date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS project_start_date    date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS project_end_date      date;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS revision_count        int NOT NULL DEFAULT 0;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS primary_contact_name  text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS primary_contact_phone text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS primary_contact_email text;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS updated_at            timestamptz NOT NULL DEFAULT now();

-- 3. Ensure the client_notes table exists
CREATE TABLE IF NOT EXISTS client_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id  uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  note       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Ensure the client_documents table exists
CREATE TABLE IF NOT EXISTS client_documents (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id        uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  doc_type         text NOT NULL,
  invoice_subtype  text,
  status           text NOT NULL DEFAULT 'Not Generated',
  generated_at     timestamptz,
  file_url         text,
  metadata         jsonb NOT NULL DEFAULT '{}',
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- 5. RLS — DISABLE completely (you are the sole admin user)
ALTER TABLE clients          DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes     DISABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents DISABLE ROW LEVEL SECURITY;

-- If DISABLE RLS alone isn't enough (anon key still blocked),
-- add a fully permissive policy as a belt-and-suspenders fix:
DROP POLICY IF EXISTS "allow_all_clients"          ON clients;
DROP POLICY IF EXISTS "allow_all_client_notes"     ON client_notes;
DROP POLICY IF EXISTS "allow_all_client_documents" ON client_documents;

CREATE POLICY "allow_all_clients"
  ON clients FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_client_notes"
  ON client_notes FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_client_documents"
  ON client_documents FOR ALL USING (true) WITH CHECK (true);

-- Re-enable RLS so the policies above actually apply
-- (policies only work when RLS is ON — DISABLE RLS bypasses policies
--  for the table owner only, not for the anon role used by the frontend)
ALTER TABLE clients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;

-- 6. Auto-update updated_at on every clients row write
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS clients_set_updated_at ON clients;
CREATE TRIGGER clients_set_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 7. Verify — run this SELECT to confirm the column exists after the script
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'clients'
ORDER BY ordinal_position;
