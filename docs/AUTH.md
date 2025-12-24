## Afrikoni Authentication & Authorization

**Last Updated:** December 22, 2025  
**Status:** ✅ Production Ready – Enterprise-grade auth live

---

## Overview

Afrikoni uses **Supabase Auth** as the single source of truth for authentication, with an extended PostgreSQL schema and React (Vite) frontend.  
All enhancements are **additive**: they extend, but do not replace, the existing auth system.

- **Auth provider**: Supabase GoTrue (`@supabase/supabase-js`)
- **Frontend**: React + React Router, using `supabase` singleton client
- **Profiles**: `profiles` table (1–1 with `auth.users`)
- **Enterprise extensions**:
  - Multi-role model: `roles`, `user_roles`, `user_preferences`
  - Business verification: `business_profiles` + legacy `companies` / `verifications`
  - Security telemetry: `auth_logs`, `login_attempts`

---

## Database Schema (Auth-Related)

### Core Tables

- **`auth.users`** (Supabase-managed)
  - Stores primary identity (email, password hash, OAuth identities)
  - Important fields:
    - `id` (UUID)
    - `email`
    - `email_confirmed_at`
    - `user_metadata` (JSONB)

- **`profiles`**
  - 1–1 mirror of `auth.users`, used for application-level profile data
  - Key columns:
    - `id` (UUID, PK, FK → `auth.users.id`)
    - `full_name`
    - `role` (`buyer`, `seller`, `hybrid`, `logistics`)
    - `onboarding_completed` (boolean)
    - `company_name`, `country`, `phone`, `website`, `business_type`, `city`
    - `account_status` (added): `active` | other future states
    - `last_login_at` (added): timestamp of last successful login

### Roles & Preferences

- **`roles`**
  - Master list of roles.
  - Seeded values:
    - `buyer`
    - `seller`
    - `logistics`

- **`user_roles`**
  - Junction table mapping users to one or more roles.
  - Columns:
    - `user_id` (FK → `auth.users.id`)
    - `role_id` (FK → `roles.id`)
    - Unique: (`user_id`, `role_id`)
  - Supports multi-role accounts (e.g. buyer + seller).

- **`user_preferences`**
  - Stores per-user preferences such as **last selected role**.
  - Columns:
    - `user_id` (FK → `auth.users.id`, unique)
    - `last_selected_role` (string)
    - `updated_at`

### Business Verification

- **`business_profiles`** (new enterprise table)
  - Business-level identity and verification state for seller/logistics accounts.
  - Columns:
    - `user_id` (FK → `auth.users.id`, unique)
    - `company_name` (required)
    - `country` (required)
    - `registration_number`
    - `documents` (JSONB) – structured document URLs
    - `verification_status`: `pending` | `approved` | `rejected`
    - `reviewed_by_admin_id` (FK → `auth.users.id`)
    - `reviewed_at`, `created_at`, `updated_at`
  - RLS:
    - Users can read and manage their own business profile.

- **Legacy tables** (still honored):
  - `companies` – legacy company record with `verification_status`, `verified`, etc.
  - `verifications` – legacy verification submissions.
  - Admin UI (`verification-review.jsx`) still operates here and is used as a **parallel** signal.

### Security & Telemetry

- **`auth_logs`**
  - Logical audit stream for auth-related events.
  - Columns:
    - `user_id` (nullable FK → `auth.users.id`)
    - `event_type` (`login_success`, `login_failed`, `password_reset`, `email_verified`, `login_rate_limited`, etc.)
    - `ip_address`, `user_agent` (optional – currently used via contextual metadata)
    - `metadata` (JSONB)
    - `created_at`

- **`login_attempts`**
  - Per-email login attempt tracking for **server-side rate limiting**.
  - Columns:
    - `email`
    - `ip_address` (optional)
    - `attempted_at`
    - `success` (boolean)
  - Indexed by `email`.

---

## Helper Functions & Libraries

### Supabase Client

- File: `src/api/supabaseClient.js`
- Exports:
  - `supabase` – singleton Supabase client
  - `ensureAuthReady()` – session readiness helper
  - `safeQuery()` – guarded query executor
  - `supabaseHelpers.auth` – `me`, `signUp`, `signIn`, `signOut`, `updateMe`, `signInWithOAuth`

### Auth Helpers

- File: `src/utils/authHelpers.js`
- Core exports:
  - `getCurrentUserAndRole(supabase, supabaseHelpers)`
    - Returns `{ user, profile, role, companyId, onboardingCompleted }`
    - Handles:
      - Profiles fallback/creation
      - Role normalization (`buyer`, `seller`, `hybrid`, `logistics`)
      - Company lookup/creation via `getOrCreateCompany`
  - `hasCompletedOnboarding(...)`
  - `requireAuth(...)` – enforces authentication + email verification
  - `requireOnboarding(...)` – ensures onboarding completed
  - `requireEmailVerification(...)`

### Enterprise Auth Helpers

- File: `src/lib/supabase-auth-helpers.ts`
- Exports:
  - `getUserRoles(userId)` → string[]
  - `addUserRole(userId, roleName)`
  - `getBusinessProfile(userId)`
  - `createBusinessProfile(userId, profile)`
  - `logAuthEvent(userId | null, eventType, metadata?)` → inserts into `auth_logs`
  - `checkLoginAttempts(email)` → count of failed attempts in last 5 minutes
  - `recordLoginAttempt(email, success)`
  - `getLastSelectedRole(userId)`
  - `setLastSelectedRole(userId, role)`

### Post-Login Redirect Logic

- File: `src/lib/post-login-redirect.ts`
- Function: `getPostLoginRedirect(userId): Promise<string>`
  - Steps:
    1. **Email verification**:  
       - If `email_confirmed_at` is null → `/verify-email-prompt`
    2. **Roles**:
       - Uses `getUserRoles(userId)`
       - If no roles → fallback to legacy `profiles.role` and `/onboarding`
    3. **Business verification (seller/logistics)**:
       - If role includes `seller` or `logistics`:
         - If `business_profiles.verification_status = 'pending'` → `/account-pending`
    4. **Single role**:
       - `/buyer/dashboard`, `/seller/dashboard`, `/logistics/dashboard`
    5. **Multi-role**:
       - If `user_preferences.last_selected_role` is valid → `/<role>/dashboard`
       - Else → `/select-role`

---

## User Flows

### 1. Registration

**Frontend**: `src/pages/signup.jsx`  
**Backend**: Supabase `auth.signUp`, `profiles`, `user_roles`

Flow:

1. User enters:
   - Full name
   - Email
   - Password (+ confirmation)
2. Password + email validations on client.
3. `supabaseHelpers.auth.signUp(email, password, metadata)`:
   - `metadata` includes `name`, (optionally roles/phone in future iterations).
4. On success:
   - Supabase sends **email verification** email.
   - `profiles` upsert with:
     - `role` defaulted based on registration choices (`buyer` / `seller` / `hybrid` / `logistics`).
   - Risk notification: `notifyAdminOfNewRegistration(...)` (best-effort).
5. **No session** until email confirmed (MVP rule).
6. User redirected to `/login?message=confirm-email`.

> Note: Multi-role registration can be extended by writing into `user_roles` immediately after `signUp`. Current implementation is compatible with that pattern via `addUserRole`.

### 2. Email Verification

**Pages**:
- `src/pages/auth-confirm.jsx` – token handling + verification
- `src/pages/auth-success.jsx` – confirmation success UX
- `src/pages/verify-email-prompt.jsx` – gated access before verification

Flow:

1. User clicks Supabase confirmation link.
2. `AuthConfirm`:
   - Reads `token` & `type` from URL hash/query.
   - Tries `supabase.auth.verifyOtp` with `token_hash` and `token`.
   - Falls back to checking `session.user.email_confirmed_at`.
3. On success:
   - `logAuthEvent(user.id, 'email_verified', {})`
   - `sendWelcomeEmail(...)`
   - Redirects to `/auth/success`, then user can navigate to `/login` or the app.
4. If invalid/expired:
   - Clear error message
   - Option to **resend** confirmation email.

### 3. Login with Rate Limiting

**Page**: `src/pages/login.jsx`

Flow:

1. User submits email + password.
2. Client-side device lockout:
   - LocalStorage configuration:
     - `MAX_ATTEMPTS = 5`
     - `LOCKOUT_MINUTES = 10`
3. Server-side rate limiting:
   - Calls `checkLoginAttempts(email)`:
     - Counts failed attempts in last 5 minutes.
   - If `>= 5`:
     - `sendAccountLockedEmail(email, name)`
     - `logAuthEvent(null, 'login_rate_limited', { email })`
     - Throws lockout error.
4. Sign-in:
   - `supabaseHelpers.auth.signIn(email, password)`
   - On error:
     - If unconfirmed email → show resend UI + `logAuthEvent(null, 'login_failed_unconfirmed', { email })`
     - Always `recordLoginAttempt(email, false)` + `logAuthEvent(null, 'login_failed', { email })`
5. On success:
   - Re-check `email_confirmed_at`:
     - If not confirmed → sign out + treat as failure (see above).
   - Success path:
     - `recordLoginAttempt(email, true)`
     - `logAuthEvent(user.id, 'login_success', {})`
     - `logLoginEvent(...)` (existing rich audit logger)
     - Compute redirect: `getPostLoginRedirect(user.id)` and `navigate(redirectPath)`.
6. If redirect computation fails → fallback:
   - Use legacy redirect behavior to `/` or `redirect` query param.

### 4. Forgot Password & Reset

**Page**: `src/pages/forgot-password.jsx`

Flow:

1. User provides email.
2. `supabase.auth.resetPasswordForEmail(email, { redirectTo: /reset-password })`
3. On success:
   - UI acknowledges email sent.
   - `logAuthEvent(null, 'password_reset_requested', { email })`.
4. When user completes reset (handled by Supabase-hosted UI or custom reset page):
   - Trigger `sendPasswordResetConfirmationEmail(email, name)` on success (hook point for future edge function or callback).

> The **request** email uses `passwordReset` template; the **confirmation** email uses `passwordResetConfirmation`.

### 5. Business Verification

Two parallel paths are supported:

1. **Enterprise-first**:
   - `business_profiles` tied directly to user (`user_id`).
   - Used by:
     - `AccountPending` page
     - `post-login-redirect` seller/logistics gating.
   - Admins may later move approvals here for a user-centric model.

2. **Legacy company-based**:
   - `companies` + `verifications` + `verification-status` page.
   - Admin review UI: `src/pages/dashboard/admin/verification-review.jsx`
     - Approve:
       - `verifications.status = 'verified'`
       - `companies.verification_status = 'verified'; verified = true; verified_at = now()`
       - Notifies via `notificationService.notifyVerificationStatusChange(companyId, 'approved', notes?)`
     - Reject:
       - Similar pattern with `status = 'rejected'`.

**User experience:**

- After login, if user has `seller` or `logistics` role:
  - If `business_profiles.verification_status = 'pending'`  
    → Redirect to `/account-pending`.
  - Else if legacy `companies.verification_status` is pending/unverified  
    → `DashboardHome` shows **Verification & Approvals** summary and calls to action.

---

## Route Protection & Roles

### High-Level Auth Guard

- Component: `src/components/ProtectedRoute.jsx` (existing)
- responsibilities:
  - Ensures user is authenticated.
  - Optionally enforces `requireOnboarding` and admin-only access.
  - Used across:
    - Dashboard entrypoints (`/dashboard`, `/dashboard/buyer`, `/dashboard/seller`, `/dashboard/logistics`, etc.)
    - Most dashboard sub-pages.

### In-App Role Context Guards

- `RoleDashboardRoute` (`src/components/RoleDashboardRoute.tsx`)
  - Uses `RoleContext` (URL-based role) to ensure correct dashboard view.
  - Redirects to the correct dashboard home if the URL role doesn’t match.

- `RequireDashboardRole` (`src/guards/RequireDashboardRole.tsx`)
  - Used inside dashboard feature modules to hide content if the **dashboard role context** doesn’t match.

### Enterprise Role-Based Route Protection

- Component: `src/components/RoleProtectedRoute.tsx`
- Purpose:
  - Enforce **database-backed roles** from `user_roles` for sensitive routes.
  - Works alongside existing context-based guards (`RoleDashboardRoute`, `ProtectedRoute`).

Usage:

```tsx
import { RoleProtectedRoute } from '@/components/RoleProtectedRoute';

<Route
  path="/seller/dashboard"
  element={
    <ProtectedRoute>
      <RoleProtectedRoute requiredRole="seller">
        <SellerDashboard />
      </RoleProtectedRoute>
    </ProtectedRoute>
  }
/>
```

Behavior:

- If unauthenticated → `ProtectedRoute` redirects to `/login`.
- If authenticated but missing `requiredRole` in `user_roles`:
  - Redirects to `/select-role` (for hybrid/misconfigured accounts).

---

## Transactional Emails

All templates live in `src/services/emailTemplates.js` and are sent via `src/services/emailService.js`.

### Templates

1. **Welcome Email** – `welcome`
   - Sent **after email verification**.
   - Trigger: `AuthConfirm` on successful verification (`sendWelcomeEmail`).

2. **Email Verification** – `accountVerification`
   - Used when sending explicit “verify your email” links (optional; Supabase has default).
   - Can be wired via custom flows or edge functions.

3. **Email Verified Confirmation** – *(uses `welcome` currently)*
   - Logical event: `email_verified`.
   - Implemented by sending `welcome` at verification time for now.

4. **Password Reset Request** – `passwordReset`
   - Trigger: `forgot-password.jsx` via `supabase.auth.resetPasswordForEmail`.
   - Template includes reset CTA + expiry info.

5. **Password Reset Confirmation** – `passwordResetConfirmation`
   - Trigger: After user successfully changes password (hook for edge function or callback).
   - Convenience: `sendPasswordResetConfirmationEmail`.

6. **Account Locked** – `accountLocked`
   - Trigger: server-side rate limit in `login.jsx` when `checkLoginAttempts(email) >= MAX_ATTEMPTS`.
   - Sent via `sendAccountLockedEmail`.

7. **Business Pending** – `businessPendingApproval`
   - Trigger: after seller/logistics submits business verification (hook point in verification submission flow).
   - Sent via `sendBusinessPendingApprovalEmail`.

8. **Business Approved** – `businessApproved`
   - Trigger: admin approves verification in `verification-review.jsx`.
   - Hook: combine `notifyVerificationStatusChange` and `sendBusinessApprovedEmail` for user-facing confirmation.

> See `src/pages/dashboard/test-emails.jsx` for manual triggers/testing patterns.

---

## Admin Business Verification Interface

**File**: `src/pages/dashboard/admin/verification-review.jsx`

Capabilities:

- Lists verification submissions (`verifications`) with joined:
  - `companies`
  - `profiles`
- Filtering:
  - Status: all, pending, verified, rejected.
  - Search: company name, country, email, business id.
- Detail modal:
  - Company info
  - Verification documents (with view/download)
  - Additional business documents from `companies`.
- Actions:
  - Approve:
    - Updates `verifications.status = 'verified'`
    - Updates `companies.verification_status = 'verified'; verified = true; verified_at = now()`
    - Sends notification via `notificationService.notifyVerificationStatusChange(companyId, 'approved', notes?)`
    - **Hook for**:
      - `sendBusinessApprovedEmail`
      - `logAuthEvent(adminUser.id, 'business_approved', { companyId, verificationId })`
  - Reject:
    - Similar updates with `status = 'rejected'` and `review_notes`.
    - Sends notification via `notifyVerificationStatusChange(companyId, 'rejected', reason)`

Access Control:

- Routes under `/dashboard/admin/*` are protected by:
  - `ProtectedRoute requireAdmin={true}`
  - `DashboardRoleProvider` (for consistent dashboard layout state).

---

## Security Features Summary

- **Email verification enforced**:
  - `requireAuth` and login logic treat unverified users as unauthenticated.
  - Dedicated `/verify-email-prompt`.

- **Rate limiting & account lockout**:
  - Server-side: `login_attempts` + `checkLoginAttempts`/`recordLoginAttempt`.
  - Client-side: localStorage-based per-device cooldown.
  - Locked accounts receive a **security email**.

- **Audit & auth logs**:
  - Rich business-event audit via `auditLogger.js` (`activity_logs`).
  - Lightweight auth-events via `auth_logs` (`logAuthEvent`).

- **Role-based gating**:
  - Multi-layer:
    - Supabase `user_roles`
    - `ProtectedRoute` for auth/admin checks
    - `RoleDashboardRoute` + `RequireDashboardRole` for dashboard contexts
    - `RoleProtectedRoute` for enterprise-grade per-route authorization.

---

## Environment Variables

Required for auth & email:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_EMAIL_PROVIDER` (`resend`, `sendgrid`, `supabase`, or `none`)
- `VITE_EMAIL_API_KEY` (for chosen provider)

Optional / recommended:

- Edge Function URL (if using Supabase functions for email):  
  - `send-email` function deployed at `${VITE_SUPABASE_URL}/functions/v1/send-email`.

---

## Troubleshooting

### Login works but redirects feel wrong

1. Check `getPostLoginRedirect`:
   - Confirm `user_roles` rows exist for the user.
   - Confirm `business_profiles` status if seller/logistics.
2. Check fallbacks:
   - `profiles.role` and existing dashboard routes.

### Users stuck on “Account Pending”

1. Verify `business_profiles.verification_status` vs `companies.verification_status`.
2. Admin should approve/reject via `/dashboard/admin/verification-review`.
3. Ensure `post-login-redirect` and `AccountPending` align on which table they read from.

### Emails not sending

1. Ensure `VITE_EMAIL_PROVIDER` and `VITE_EMAIL_API_KEY` are set.
2. In dev, check console logs from `emailService.js`.
3. For Resend:
   - API key should start with `re_`.

---

## Future Extensions

- Move all business verification state to `business_profiles` (user-centric).
- Add IP + user-agent capture for `auth_logs` via edge function.
- Tighten RLS around `auth_logs`, `login_attempts`, and `business_profiles` as needed.


