-- =============================================================================
-- Migration: extend clients with project / business / billing / agreement /
--            contact fields, and create client_documents table.
-- Safe to run repeatedly (idempotent guards on every statement).
-- Backward compatible: no existing column is renamed or dropped, all new
-- columns are nullable or have defaults.
-- =============================================================================

-- --- clients: new columns ----------------------------------------------------
alter table public.clients
  add column if not exists project_name         text,
  add column if not exists project_type         text,
  add column if not exists project_description  text,
  add column if not exists scope_of_work        text,
  add column if not exists timeline             text,
  add column if not exists delivery_date        date,

  add column if not exists owner_name           text,
  add column if not exists business_address     text,
  add column if not exists gst_number           text,
  add column if not exists business_website     text,
  add column if not exists business_email       text,

  add column if not exists advance_amount       numeric,
  add column if not exists payment_status       text not null default 'Not Started',

  add column if not exists agreement_date       date,
  add column if not exists project_start_date   date,
  add column if not exists project_end_date     date,
  add column if not exists revision_count       integer not null default 0,
  add column if not exists terms_notes          text,

  add column if not exists primary_contact_name  text,
  add column if not exists primary_contact_phone text,
  add column if not exists primary_contact_email text;

-- Constrain payment_status to the allowed set.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'clients_payment_status_check'
  ) then
    alter table public.clients
      add constraint clients_payment_status_check
      check (payment_status in (
        'Not Started','Advance Paid','Partially Paid','Fully Paid','Refunded'
      ));
  end if;
end$$;

-- --- client_documents --------------------------------------------------------
create table if not exists public.client_documents (
  id            uuid primary key default gen_random_uuid(),
  client_id     uuid not null references public.clients(id) on delete cascade,
  doc_type      text not null check (doc_type in ('Proposal','Agreement','Invoice','Handover')),
  status        text not null default 'Not Generated'
                check (status in ('Not Generated','Generated')),
  generated_at  timestamptz,
  file_url      text,
  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (client_id, doc_type)
);

create index if not exists client_documents_client_id_idx
  on public.client_documents (client_id);

-- Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end$$;

drop trigger if exists client_documents_set_updated_at on public.client_documents;
create trigger client_documents_set_updated_at
  before update on public.client_documents
  for each row execute function public.set_updated_at();

-- --- Grants (Supabase Data API) ---------------------------------------------
grant select, insert, update, delete on public.client_documents to authenticated;
grant all on public.client_documents to service_role;

-- --- RLS ---------------------------------------------------------------------
alter table public.client_documents enable row level security;

-- Admin CRM is auth-only. Adjust to match the policy you use on `clients`
-- if you have a stricter rule (e.g. has_role(auth.uid(), 'admin')).
drop policy if exists "client_documents_auth_all" on public.client_documents;
create policy "client_documents_auth_all"
  on public.client_documents
  for all
  to authenticated
  using (true)
  with check (true);
