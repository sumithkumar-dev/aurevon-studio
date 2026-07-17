# Admin CRM — Sales Workflow update

This drop-in turns the admin CRM into a real day-to-day sales tool for a
two-person studio: a full lead profile (contact, online presence, sales
info, structured business notes, freeform research notes), drag-and-drop
priority ordering, a Call History / Client Timeline, Tasks, automatic
Lead → Client conversion on **Won**, a Dashboard overview (funnel, revenue,
renewals, follow-ups), and global search.

## What changed

### New / updated files
```
admin/
  types.ts                        # expanded Lead + Client, TimelineEvent, Task types
  constants.ts                    # new status/priority/notes option lists
  utils.ts                        # date helpers (isOverdue/isToday/isUpcoming), reindex()
  lib/
    leads.ts                      # full field set, reorderLeads(), auto sort_order
    clients.ts                    # infra/renewal fields, richer convertLeadToClient()
    timeline.ts                   # NEW — shared Call History / Client Timeline
    tasks.ts                      # NEW — shared Tasks for leads & clients
  components/
    LeadBoard.tsx                 # NEW — drag-and-drop priority board (High/Medium/Low)
    LeadDrawer.tsx                # rewritten — full field set, Timeline, Tasks
    LeadTable.tsx                 # updated columns (owner, city, WhatsApp, follow-up)
    AddLeadDialog.tsx             # rewritten — sectioned Basic/Online presence/Sales form
    Timeline.tsx                  # NEW — shared timeline UI (leads + clients)
    TasksPanel.tsx                # NEW — shared task list UI (leads + clients)
    DashboardOverview.tsx         # NEW — funnel, revenue, MRR, renewals, follow-ups
    GlobalSearch.tsx              # NEW — header search across leads + clients
    TasksTab.tsx                  # NEW — all open tasks, grouped by due date
    Dashboard.tsx                 # rewired — new "Dashboard"/"Tasks" tabs, board/table toggle
    ClientsTable.tsx              # + Renewals column
    ClientWorkspace.tsx           # + Infrastructure / Activity / Tasks tabs
    NotesSection.tsx              # REMOVED — superseded by the lead Timeline
  migrations/
    20260716120000_sales_workflow_crm.sql   # SQL migration
```

Nothing else in the admin folder is touched. The public site, contact forms,
fonts, colors and branding are not modified.

### Leads — full CRM profile
Basic info (business name, owner name, phone, WhatsApp, email, category,
city, address), online presence (website, Instagram, Google Maps, Facebook),
sales info (12-stage status, priority, drag ordering), important dates (last
contact, next follow-up), structured business notes (best time to call,
preferred contact method, decision maker, marketing handled by, future
plans, pain points, objections, next best action, general notes), and a long
freeform **Research Notes** field (markdown). All of this lives in the
`LeadDrawer`, with Business Notes and Research Notes as collapsible
sections.

### Lead priority board (drag-and-drop)
`LeadBoard.tsx` groups leads into **High / Medium / Low** columns. Reorder
by dragging (framer-motion `Reorder`), by the up/down buttons on each card,
or move a lead to a different priority column entirely via its priority
pill. Order is persisted to `sort_order` on `contact_submissions`,
renumbered sequentially (10, 20, 30…) per priority column after every
change. A Board/Table toggle sits next to the existing filters.

### Call History / Client Timeline
One shared `timeline_events` table (`public.timeline_events`) powers both:
- **Call History** on a lead — calls, WhatsApp, email, meetings, demos,
  proposals, follow-ups, notes.
- **Activity** on a client — website delivered, bug fixes, feature
  requests, event updates, payments received, meetings, calls — everything
  in one place.

Every entry is timestamped automatically (`created_at`). Status and priority
changes on a lead are logged automatically too.

### Tasks
`public.tasks` is a second shared, polymorphic table (`entity_type` +
`entity_id`) for to-dos on any lead or client ("Call tomorrow", "Send demo",
"Collect logo", "Buy domain", "Deploy website"...). A dedicated **Tasks**
tab on the dashboard lists every open task across every lead and client,
grouped into Overdue / Today / Upcoming / No due date.

### Automatic Lead → Client conversion
The moment a lead's status is set to **Won** (from the board, the table, or
the drawer), it's automatically converted into a Client — carrying over
contact details, website, and research notes — and a "Converted from lead"
entry is seeded on the new client's Activity timeline. Converting is
idempotent: a lead that's already been converted is never duplicated. The
manual **Convert To Client** button in the drawer still works too.

### Dashboard overview
A new **Dashboard** tab (the default landing tab) shows: the lead funnel
(New → Ready to Call → Interested → Demo Sent → Meeting Scheduled → Won),
revenue this month, monthly recurring revenue, upcoming renewals (domain /
hosting expiry within 30 days), today's calls, and Overdue / Today /
Upcoming follow-up lists — each entry click-through opens the lead.

### Global search
A search box in the header matches leads (business name, owner, phone,
WhatsApp, Instagram, Google Maps, city, and every notes field) and clients
(business name, contact name, phone, email, features, notes) as you type,
and opens the matching drawer on click.

### Client — infrastructure & renewals
New **Infrastructure** tab on the Client workspace: domain registrar +
expiry, hosting provider + expiry, GitHub, Vercel, Supabase project,
Google Search Console, Google Analytics, Google Business Profile, monthly
plan, maintenance plan, monthly revenue, and a free-text "current features"
field. The Clients table shows a **Renewals** column flagging anything
expiring (or already expired) within 30 days.

All inputs persist via the existing `onPatch` flow to Supabase. Nothing is
written to `localStorage`.

## Database changes

Run the SQL in
`admin/migrations/20260716120000_sales_workflow_crm.sql` against your
Supabase project (Lovable Cloud SQL editor or `psql`). It is safe to run
more than once.

- `public.contact_submissions` (leads) — adds every new lead field listed
  above plus `sort_order`. Backfills `owner_name` from `name`,
  `business_category` from `industry`, `next_followup_date` from
  `follow_up_date`, and `sort_order` from creation order — so existing leads
  render correctly with no manual cleanup. Existing `status` values are
  migrated (`Contacted` → `Called`, `Rejected` → `Lost`) and a check
  constraint enforces the new 12-stage pipeline going forward.
- `public.clients` — adds the infrastructure/renewal/revenue columns listed
  above. All nullable or defaulted (`monthly_revenue` defaults to `0`).
- `public.timeline_events` — new table, polymorphic over `entity_type`
  (`lead` | `client`) + `entity_id`.
- `public.tasks` — new table, same polymorphic shape, plus `due_date` /
  `is_done` / `completed_at`.
- Grants + RLS enabled on both new tables (policy: any authenticated
  user — matches the existing admin-only CRM model; tighten if you use
  `has_role()` on other tables).

No existing column is renamed or dropped. Existing leads and clients keep
working unchanged — every new lead/client field falls back gracefully when
absent.

## Deployment

1. Copy the contents of this `admin/` folder over your project's existing
   `src/<admin path>/admin/` folder (overwrite), and copy the updated
   `src/integrations/supabase/types.ts` over the existing one.
2. Open Lovable Cloud → SQL editor and run
   `admin/migrations/20260716120000_sales_workflow_crm.sql`.
3. Reload the admin app. The **Dashboard** tab is now the default landing
   tab; **Leads** defaults to the priority Board view.

## Verification checklist

- [ ] Existing leads list loads unchanged; legacy status values show as
      their migrated equivalents (Contacted → Called, Rejected → Lost).
- [ ] Existing clients list loads unchanged.
- [ ] Leads tab: Board view shows High/Medium/Low columns; drag a card to
      reorder, use the up/down arrows, and change a card's priority pill —
      all three persist after a refresh.
- [ ] Add Lead captures business/owner/phone (required) plus the optional
      fields, and the lead appears at the bottom of its priority column.
- [ ] Opening a lead shows Contact / Business / Online Presence / Business
      Notes (collapsible) / Research Notes (collapsible) / Call History /
      Tasks.
- [ ] Logging a call in Call History timestamps it automatically and shows
      up grouped by date.
- [ ] Changing a lead's status to **Won** auto-creates a Client and shows a
      confirmation in the drawer footer; the client's Activity tab shows a
      "Converted from lead" entry.
- [ ] Client workspace shows the new **Infrastructure**, **Activity**, and
      **Tasks** tabs; infra fields persist after blur.
- [ ] Clients table shows a **Renewals** badge for any client with a
      domain/hosting expiry within 30 days (or already expired).
- [ ] Dashboard tab shows the lead funnel, revenue this month, MRR,
      upcoming renewals, and Overdue/Today/Upcoming follow-up lists.
- [ ] Tasks tab lists open tasks from every lead and client, grouped by due
      date; marking one done removes it from the list.
- [ ] Header search matches on business name, owner, phone, city, and notes
      for both leads and clients, and opens the right drawer on click.
- [ ] SQL re-run is idempotent (safe to apply twice).

## Final ZIP

`admin-sales-workflow.zip` ships the full updated `admin/` folder, the
updated `integrations/supabase/types.ts`, the migration, and this README.
