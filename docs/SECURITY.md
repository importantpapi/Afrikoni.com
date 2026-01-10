## Afrikoni Security Notes

### 1. Service role key usage and rotation

- **Frontend**:
  - The browser bundle uses **only** `VITE_SUPABASE_ANON_KEY` and never the Supabase `service_role` key.
  - Searches for `service_role`, `SUPABASE_SERVICE_ROLE_KEY`, and similar identifiers confirmed that any service keys are used **only** in:
    - Supabase Edge Functions (server-side)
    - Local Node scripts under `scripts/`
    - SQL migrations (grants to the `service_role` Postgres role)
  - No `VITE_SUPABASE_SERVICE_ROLE_KEY` or similar service-role env vars are referenced in `src/`.

If you ever suspect the service_role key may have been exposed client‑side or committed:

1. **Rotate keys in Supabase Dashboard**
   - Go to **Supabase Dashboard → Project Settings → API**.
   - Under **Project API keys**, click **Regenerate** next to:
     - `service_role` key (critical if leaked).
     - `anon` key if you want a clean rotation for public clients.
   - Update the new keys in:
     - Supabase Edge Function environment (`SUPABASE_SERVICE_ROLE_KEY` where used).
     - Local `.env` files and CI/CD secrets.
2. **Invalidate old clients**
   - Redeploy the frontend and any backend services (Edge Functions, Node scripts) with the new keys.
   - Remove old `.env` files or credentials from any machines where they were stored.

### 2. RLS and data isolation guarantees

- Core dashboard tables (orders, products, RFQs, invoices, escrow, reviews, etc.) have **Row Level Security enabled** and policies scoped to:
  - `public.current_company_id()` (company-based ownership derived from `auth.uid()`), or
  - Explicit buyer/seller company ID checks where appropriate.
- These policies apply to **SELECT, INSERT, UPDATE, DELETE** so even a compromised UI or crafted query cannot read or mutate another company’s data.

### 3. Frontend auth gate and runtime ownership checks

- All dashboard entry routes are wrapped in a shared `AuthGate` component:
  - Revalidates `supabase.auth.getSession()` and `supabase.auth.getUser()` on mount.
  - Confirms `session.user.id === user.id`.
  - On any mismatch or missing session:
    - Calls `supabase.auth.signOut()`.
    - Clears `localStorage` and `sessionStorage`.
    - Redirects to `/login`.
- Runtime helpers in `src/utils/securityAssertions.js` provide **defense-in-depth**:
  - `assertRowOwnedByCompany(row, companyId, context)`
  - `assertRowOwnedByUser(row, userId, context)`
  - On mismatch they:
    - Log a `[SECURITY] ownership violation`.
    - Show an error toast.
    - Sign the user out and redirect to `/login`.


