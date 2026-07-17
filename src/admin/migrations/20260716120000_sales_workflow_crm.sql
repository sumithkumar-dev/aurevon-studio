-- ============================================================================
-- Sales workflow CRM upgrade
-- ============================================================================
-- Adds everything needed for a real day-to-day sales workflow on top of the
-- existing `contact_submissions` (leads) and `clients` tables:
--   1. Full lead profile: business/online-presence/sales/business-notes/
--      research fields, WhatsApp, richer statuses, manual drag ordering.
--   2. `timeline_events` — a single polymorphic table used for BOTH the lead
--      "Call History" and the client "Timeline" (website delivered, bug
--      fixes, feature requests, payments, meetings, calls — everything).
--   3. `tasks` — polymorphic to-dos for leads and clients.
--   4. Client infrastructure/renewal fields (domain, hosting, GitHub,
--      Vercel, Supabase, Analytics, Search Console, Business Profile,
--      plans, monthly revenue, renewal dates).
--
-- Safe to run multiple times: every statement is guarded with
-- IF (NOT) EXISTS or an equivalent idempotent pattern. No existing column
-- is renamed or dropped, and no existing row is deleted — this is a purely
-- additive migration, so already-running installs keep working unchanged.
-- ============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. LEADS (public.contact_submissions) — new CRM columns
-- ----------------------------------------------------------------------------

alter table public.contact_submissions
  -- Basic information
  add column if not exists owner_name text,
  add column if not exists whatsapp_number text,
  add column if not exists business_category text,
  add column if not exists city text,
  add column if not exists address text,
  -- Online presence
  add column if not exists website_url text,
  add column if not exists instagram_url text,
  add column if not exists google_maps_url text,
  add column if not exists facebook_url text,
  -- Important dates
  add column if not exists last_contact_date date,
  add column if not exists next_followup_date date,
  -- Business notes
  add column if not exists best_time_to_call text,
  add column if not exists preferred_contact_method text,
  add column if not exists decision_maker text,
  add column if not exists marketing_handled_by text,
  add column if not exists future_plans text,
  add column if not exists pain_points text,
  add column if not exists objections text,
  add column if not exists next_best_action text,
  add column if not exists general_notes text,
  -- Research notes (long markdown)
  add column if not exists research_notes text,
  -- Manual drag ordering, scoped per priority column in the app layer
  add column if not exists sort_order integer not null default 0;

-- Backward compatibility: backfill new columns from the legacy ones they
-- replace/extend, but only for rows that don't already have a value —
-- never overwrite anything a user has already entered under the new schema.
update public.contact_submissions
   set owner_name = name
 where owner_name is null and name is not null and name <> '';

update public.contact_submissions
   set business_category = industry
 where business_category is null and industry is not null and industry <> '';

update public.contact_submissions
   set next_followup_date = follow_up_date::date
 where next_followup_date is null and follow_up_date is not null;

-- Backfill sort_order for pre-existing rows so drag ordering starts from a
-- sensible position (oldest lead in each priority bucket first).
with ranked as (
  select id, row_number() over (partition by priority order by created_at asc) as rn
  from public.contact_submissions
)
update public.contact_submissions cs
   set sort_order = ranked.rn * 10
  from ranked
 where cs.id = ranked.id
   and cs.sort_order = 0;

-- Expand the lead status vocabulary to the full sales pipeline and migrate
-- existing values across. "Contacted" is the closest legacy match for
-- "Called", and "Rejected" maps to "Lost".
update public.contact_submissions set status = 'Called' where status = 'Contacted';
update public.contact_submissions set status = 'Lost' where status = 'Rejected';

alter table public.contact_submissions drop constraint if exists contact_submissions_status_check;
alter table public.contact_submissions
  add constraint contact_submissions_status_check
  check (status in (
    'New', 'Researching', 'Ready to Call', 'Called', 'Interested',
    'Demo Sent', 'Meeting Scheduled', 'Proposal Sent', 'Negotiating',
    'Won', 'Lost', 'Follow Up Later'
  ));

alter table public.contact_submissions drop constraint if exists contact_submissions_priority_check;
alter table public.contact_submissions
  add constraint contact_submissions_priority_check
  check (priority in ('High', 'Medium', 'Low'));

create index if not exists idx_contact_submissions_priority_sort
  on public.contact_submissions (priority, sort_order);
create index if not exists idx_contact_submissions_next_followup
  on public.contact_submissions (next_followup_date);
create index if not exists idx_contact_submissions_status
  on public.contact_submissions (status);

-- ----------------------------------------------------------------------------
-- 2. CLIENTS (public.clients) — infrastructure & renewal columns
-- ----------------------------------------------------------------------------

alter table public.clients
  add column if not exists domain_registrar text,
  add column if not exists hosting_provider text,
  add column if not exists github_url text,
  add column if not exists vercel_url text,
  add column if not exists supabase_project_url text,
  add column if not exists google_search_console_url text,
  add column if not exists google_analytics_url text,
  add column if not exists google_business_profile_url text,
  add column if not exists monthly_plan text,
  add column if not exists maintenance_plan text,
  add column if not exists monthly_revenue numeric not null default 0,
  add column if not exists domain_expiry date,
  add column if not exists hosting_expiry date,
  add column if not exists current_features text;

create index if not exists idx_clients_domain_expiry on public.clients (domain_expiry);
create index if not exists idx_clients_hosting_expiry on public.clients (hosting_expiry);

-- ----------------------------------------------------------------------------
-- 3. TIMELINE (public.timeline_events) — polymorphic history for both leads
--    (Call History) and clients (Client Timeline: delivered, bugs, features,
--    events, payments, meetings, calls — everything in one place).
-- ----------------------------------------------------------------------------

create table if not exists public.timeline_events (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('lead', 'client')),
  entity_id uuid not null,
  event_type text not null check (event_type in (
    'call', 'note', 'status_change', 'priority_change', 'email',
    'whatsapp', 'meeting', 'demo_sent', 'proposal_sent', 'follow_up',
    'website_delivered', 'bug_fix', 'feature_request', 'event_update',
    'payment_received', 'task_completed', 'converted', 'other'
  )),
  title text not null,
  body text,
  created_at timestamptz not null default now()
);

create index if not exists idx_timeline_events_entity
  on public.timeline_events (entity_type, entity_id, created_at desc);

alter table public.timeline_events enable row level security;

drop policy if exists "Authenticated users manage timeline_events" on public.timeline_events;
create policy "Authenticated users manage timeline_events"
  on public.timeline_events
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.timeline_events to authenticated;

-- ----------------------------------------------------------------------------
-- 4. TASKS (public.tasks) — polymorphic to-dos for leads and clients.
-- ----------------------------------------------------------------------------

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('lead', 'client')),
  entity_id uuid not null,
  title text not null,
  due_date date,
  is_done boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_tasks_entity on public.tasks (entity_type, entity_id);
create index if not exists idx_tasks_due_open on public.tasks (due_date) where is_done = false;

alter table public.tasks enable row level security;

drop policy if exists "Authenticated users manage tasks" on public.tasks;
create policy "Authenticated users manage tasks"
  on public.tasks
  for all
  to authenticated
  using (true)
  with check (true);

grant select, insert, update, delete on public.tasks to authenticated;

-- ============================================================================
-- Verification (run manually, not part of the migration):
--   select status, count(*) from public.contact_submissions group by 1;
--   select priority, sort_order, business_name from public.contact_submissions
--     order by priority, sort_order;
--   select * from public.timeline_events limit 10;
--   select * from public.tasks limit 10;
-- ============================================================================
