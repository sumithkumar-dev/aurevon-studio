# Admin CRM — Project Profile update

This drop-in extends the Client record with every field needed for future
**Proposal / Agreement / Invoice / Handover** PDF generation, and adds a
`Documents` tab inside the Client drawer. No PDFs are generated yet.

## What changed

### New / updated files
```
admin/
  types.ts                        # extended Client, PaymentStatus, ClientDocument
  constants.ts                    # PAYMENT_STATUS_OPTIONS, DOCUMENT_TYPES
  utils.ts                        # + paymentStatusClasses()
  lib/
    clients.ts                    # normalise/patch all new columns
    documents.ts                  # NEW — fetchClientDocuments() w/ placeholder rows
  components/
    ClientDrawer.tsx              # tabs: Details (existing + new sections) / Documents
  migrations/
    2026XXXXXXXXXX_client_project_profile.sql   # SQL migration
```

Nothing else in the admin folder is touched. The public site, contact forms,
fonts, colors and branding are not modified.

### New sections in the Client drawer → **Details** tab
- Project Details — name, type, description, scope, timeline, delivery date
- Business Details — business name, owner, address, GST, website, email
- Billing Details — quoted, final, advance amount, advance paid, remaining
  (auto), payment status
- Agreement Details — agreement date, start/end dates, revision count, terms
- Document Contact Details — primary contact name / phone / email

All inputs persist via the existing `onPatch` flow (`updateClient`) to
Supabase. Nothing is written to `localStorage`.

### New **Documents** tab
Renders four cards (`Proposal`, `Agreement`, `Invoice`, `Handover`) with:
- Status: `Not Generated` (default) or `Generated`
- Generated Date: empty until a row in `client_documents` is created

The tab reads `public.client_documents`; if a row doesn't exist for a doc
type, a placeholder is shown — no DB writes happen until the future PDF
engine is wired in.

## Database changes

Run the SQL in `admin/migrations/2026XXXXXXXXXX_client_project_profile.sql`
against your Supabase project (Lovable Cloud SQL editor or `psql`).

- `public.clients` — adds the new columns listed above. All are nullable or
  have defaults (`payment_status` defaults to `'Not Started'`,
  `revision_count` defaults to `0`).
- `public.client_documents` — new table, one row per (client, doc_type),
  with `status`, `generated_at`, `file_url`, `metadata jsonb`.
- Grants + RLS enabled (policy: any authenticated user — matches the existing
  admin-only CRM model; tighten if you use `has_role()` on other tables).

No existing column is renamed or dropped. Existing leads and clients keep
working unchanged.

## Deployment

1. Copy the contents of this `admin/` folder over your project's existing
   `src/<admin path>/admin/` folder (overwrite). The import paths
   (`@/integrations/supabase/client`, `./components/...`, etc.) are unchanged.
2. Open Lovable Cloud → SQL editor and run
   `admin/migrations/2026XXXXXXXXXX_client_project_profile.sql` (rename the
   file's timestamp prefix to today's date if your project uses sequential
   migrations).
3. Reload the admin app. Open any client → the drawer now shows
   **Details / Documents** tabs.

## Verification checklist

- [ ] Existing leads list loads unchanged.
- [ ] Existing clients list loads unchanged; project status and final budget
      still edit + persist.
- [ ] Opening a client drawer shows two tabs: **Details** and **Documents**.
- [ ] In **Details**, every new field (Project / Business / Billing /
      Agreement / Document Contact) accepts input and persists after blur
      (refresh the drawer to confirm).
- [ ] Payment status dropdown shows the 5 options and the badge in the
      header updates immediately.
- [ ] Remaining amount auto-updates from final price − advance paid.
- [ ] In **Documents**, all four cards render with status
      `Not Generated` and empty generated date.
- [ ] Network tab: writes go to Supabase `clients` table (PATCH), reads
      from `client_documents` (GET). No `localStorage` writes for document
      state.
- [ ] SQL re-run is idempotent (safe to apply twice).

## Final ZIP

`admin-project-profile.zip` ships the full updated `admin/` folder plus the
migration and this README.
