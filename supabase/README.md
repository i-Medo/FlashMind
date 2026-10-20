# Supabase data layer

1. Supabase dashboard → SQL editor → paste `schema.sql` → Run.
2. Auth → create your one user (email+password); no signup UI in the app.
3. Paste project URL + anon key into `CONFIG` at top of `adapter.js`.
4. Agent card-writing: needs the **service_role** key — call PostgREST directly (`/rest/v1/cards` etc.) with `apikey` + `Authorization: Bearer <service_role>` headers; RLS is bypassed, so include `user_id` = your user's UUID on every insert.
5. Keep the service_role key server-side only (vault); the anon key in the PWA is fine — RLS limits it to your rows.
