# Export Lovable Cloud data → Import into your own Supabase project

## What I'll do (build step)

Export every user-data table from Lovable Cloud to CSV files in `/mnt/documents/kender-export/` so you can download them. I'll skip system tables (`auth.*`, `storage.*`) — those are managed by Supabase itself and can't be moved by CSV.

Tables to export (in dependency order so imports work later):

1. `profiles`
2. `characters`
3. `chat_messages`
4. `direct_messages`
5. `user_follows`
6. `user_user_follows`
7. `user_likes`
8. `user_saves`
9. `user_blocks`
10. `user_reports`
11. `push_subscriptions`
12. `notifications_state`

Each becomes a `.csv` with headers. I'll also generate a `schema.sql` file containing the `CREATE TABLE`, `GRANT`, RLS policies, and helper functions (`handle_new_user`, `check_chat_rate_limit`) so you can recreate the schema in your Supabase project before importing rows.

You'll get a downloadable bundle listed in chat via artifact links.

## Step-by-step: import into your own Supabase account

**Important caveat first:** Rows in `profiles`, `characters`, `chat_messages`, etc. reference user IDs from `auth.users` in Lovable Cloud. Those user IDs won't exist in your new Supabase project until the same users sign up there (or you use the Supabase Admin API to create them with matching UUIDs). Without matching `auth.users` rows, foreign keys will fail. Options:

- **Option A (recommended, clean start):** Import only `characters` that you want to keep as seed data, re-map `creator_id` to your new user id after you sign up in the new project. Skip chat/follow/like history.
- **Option B (full migration):** Use Supabase's Admin API to recreate each `auth.users` row with the exact same UUID, then import everything. This requires service-role access to your new project.

### Steps

1. **Create your Supabase project** at supabase.com (if not already done).
2. **Recreate the schema:** Open the SQL Editor in your new Supabase dashboard → paste the contents of `schema.sql` → Run. This creates tables, grants, RLS, and functions.
3. **(Option B only) Recreate users:** For each unique `id` in your exported `profiles.csv`, call `POST /auth/v1/admin/users` on your new project with `{ "id": "<same-uuid>", "email": "<email>", "email_confirm": true }` using the service role key. Script this in Node/Python — I can generate the script if you go this route.
4. **Import CSVs in order** (matches the numbered list above). In Supabase dashboard: Table Editor → pick table → Insert → Import data from CSV → upload the file. Import `profiles` first, then `characters`, then the rest.
5. **Update your app's env vars** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`) to point at your new project if you want the Kender app to use it. Note: this disconnects the app from Lovable Cloud — Lovable-managed features (edge functions, secrets like `OPENROUTER_API_KEY`, cron jobs) won't automatically move.
6. **Verify** by running `SELECT count(*) FROM public.characters;` etc. in your new project's SQL editor.

## Technical notes

- CSVs use `COPY ... TO STDOUT WITH CSV HEADER` — standard Postgres format Supabase's importer accepts natively.
- `auth.users` and `storage.objects` are **not exported**. Supabase does not allow direct writes to `auth.users` via SQL; use the Admin API.
- After you confirm the plan, I'll produce the files and post download links. Then tell me whether you want Option A or B, and I'll tailor the next steps (including generating a user-recreation script for Option B).

## Deliverables

- `/mnt/documents/kender-export/schema.sql`
- `/mnt/documents/kender-export/<table>.csv` × 12
- Artifact links posted in chat for download.

Approve and I'll run the export.