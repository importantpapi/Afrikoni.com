# Complete System Audit - Afrikoni Marketplace

**Date:** 2025-01-XX  
**Auditor:** Principal Engineer  
**Purpose:** Full architectural documentation of runtime behavior for safe future updates

---

## 1. System Overview

### Application Type
**Afrikoni** is a B2B marketplace platform connecting verified African suppliers with global buyers. It operates as a React SPA (Single Page Application) built with Vite, deployed on Vercel, using Supabase as the backend (PostgreSQL database, Authentication, Storage, Realtime).

### Core User Types
1. **Buyers** - Purchase products from verified suppliers
2. **Sellers** - List and sell products, manage inventory
3. **Hybrid** - Users who can both buy and sell
4. **Logistics Partners** - Provide shipping and logistics services
5. **Admins** - Platform administrators with full access
6. **Founder/CEO** (`youba.thiam@icloud.com`) - Special privileges including dev role switcher

### High-Level Runtime Architecture
- **Frontend:** React 18.2.0 with React Router v6.20.0
- **Build Tool:** Vite 5.0.8
- **UI Framework:** TailwindCSS with custom Afrikoni design system
- **State Management:** React Context API (`RoleContext`, `DashboardRoleContext`, `LanguageContext`, `CurrencyContext`)
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Realtime)
- **Deployment:** Vercel with cache-busting headers
- **Error Tracking:** Sentry (when configured)
- **Analytics:** Google Analytics 4 (when configured)

---

## 2. Application Boot Flow

### Initial Load Sequence (`src/main.jsx`)
1. **React DOM renders** `<App />` wrapped in `<ErrorBoundary>` and `<BrowserRouter>`
2. **Global initialization:**
   - Sentry error tracking (fails silently if not configured)
   - Google Analytics 4 (fails silently if not configured)
   - Page load performance tracking
3. **App Component (`src/App.jsx`) mounts:**
   - Context providers wrap the app: `LanguageProvider`, `CurrencyProvider`, `RoleProvider`
   - Session refresh hook (`useSessionRefresh`) starts monitoring auth state
   - Browser navigation hook (`useBrowserNavigation`) sets up keyboard shortcuts
   - Link preloading setup runs

### Auth State Restoration
- **On mount:** `useSessionRefresh` hook calls `supabase.auth.getSession()` to check for existing session
- **Session persistence:** Supabase stores session in `localStorage` (key: `sb-{project-id}-auth-token`)
- **Auto-refresh:** Supabase automatically refreshes tokens before expiry (monitored every 30 minutes)
- **Auth state listener:** `supabase.auth.onAuthStateChange` fires on SIGNED_IN, SIGNED_OUT, TOKEN_REFRESHED events

### Data Fetching Timeline
1. **Route-level:** `ProtectedRoute` checks auth before rendering
2. **Component-level:** Individual pages fetch data in `useEffect` hooks
3. **Dashboard:** `Dashboard` component checks role and onboarding status before rendering content
4. **Lazy loading:** Heavy routes are code-split and loaded on-demand

### Routing Decisions
- **Post-login:** All authenticated users go through `PostLoginRouter` (`/auth/post-login`) which:
  - Fetches profile from `profiles` table
  - Self-heals missing profiles (creates with defaults)
  - Checks `onboarding_completed` flag
  - Redirects to role-specific dashboard based on `role` field
- **Default redirect:** Unauthenticated users → `/login`
- **Onboarding gate:** Users with `onboarding_completed: false` → `/dashboard` (shows RoleSelection component)

---

## 3. Routing & Navigation Map

### Public Routes (No Auth Required)
- `/` - Homepage
- `/login` - Login page
- `/signup` - Signup page
- `/forgot-password` - Password reset
- `/products` - Product marketplace
- `/marketplace` - Marketplace browse
- `/suppliers` - Verified suppliers listing (only shows `verified: true`)
- `/product/:slug` - Product detail page
- `/categories` - Category browse
- `/countries` - Country browse
- `/how-it-works` - How it works page
- `/about` - About page
- `/contact` - Contact page
- `/pricing` - Pricing page
- `/privacy-policy`, `/terms-and-conditions`, `/cookie-policy` - Legal pages
- `/sitemap.xml` - Sitemap

### Protected Routes (Auth Required)
All routes under `/dashboard/*` require authentication via `ProtectedRoute` component.

### Dashboard Entry Routes
All dashboard routes are wrapped with:
- `<ProtectedRoute requireOnboarding={true}>` - Checks auth + onboarding
- `<DashboardRoleProvider>` - Provides URL-derived role context
- `<Dashboard />` - Main dashboard router component

**Entry Points:**
- `/dashboard` - Base route, redirects to role-specific dashboard
- `/dashboard/buyer` - Buyer dashboard
- `/dashboard/seller` - Seller dashboard
- `/dashboard/hybrid` - Hybrid dashboard
- `/dashboard/logistics` - Logistics dashboard
- `/dashboard/admin` - Admin dashboard (requires `requireAdmin={true}`)

### Dashboard Sub-Routes
All sub-routes wrapped with `<ProtectedRoute>` + `<DashboardRoleProvider>`:

**Common Routes (All Roles):**
- `/dashboard/orders` - Order management (uses `RequireDashboardRole allow={['buyer', 'hybrid']}`)
- `/dashboard/orders/:id` - Order detail
- `/dashboard/rfqs` - RFQ management (uses `RequireDashboardRole allow={['buyer', 'hybrid']}`)
- `/dashboard/rfqs/:id` - RFQ detail
- `/dashboard/rfqs/new` - Create RFQ
- `/dashboard/messages` - Messages (redirects to `/messages`)
- `/dashboard/payments` - Payment management
- `/dashboard/invoices` - Invoice list
- `/dashboard/invoices/:id` - Invoice detail
- `/dashboard/returns` - Returns management
- `/dashboard/returns/:id` - Return detail
- `/dashboard/company-info` - Company profile
- `/dashboard/settings` - User settings
- `/dashboard/notifications` - Notifications center
- `/dashboard/help` - Help center
- `/dashboard/support-chat` - Support chat (allows: `['buyer', 'seller', 'hybrid', 'logistics']`)
- `/dashboard/disputes` - Disputes management
- `/dashboard/saved` - Saved products
- `/dashboard/subscriptions` - Subscription management

**Seller-Only Routes:**
- `/dashboard/products` - Product management (`RequireDashboardRole allow={['seller', 'hybrid']}`)
- `/dashboard/products/new` - Add product
- `/dashboard/products/:id/edit` - Edit product
- `/dashboard/sales` - Sales dashboard (`RequireDashboardRole allow={['seller', 'hybrid']}`)
- `/dashboard/fulfillment` - Fulfillment management
- `/dashboard/supplier-analytics` - Seller analytics
- `/dashboard/performance` - Performance metrics
- `/dashboard/reviews` - Review management
- `/dashboard/team-members` - Team management (`RequireDashboardRole allow={['seller', 'hybrid']}`)
- `/dashboard/verification-marketplace` - Verification marketplace
- `/dashboard/supplier-rfqs` - Supplier RFQs
- `/dashboard/subscriptions` - Subscriptions

**Logistics Routes:**
- `/dashboard/shipments` - Shipment management
- `/dashboard/shipments/new` - New shipment
- `/dashboard/shipments/:id` - Shipment detail
- `/dashboard/logistics-quote` - Logistics quotes
- `/dashboard/orders/:orderId/logistics-quote` - Order logistics quote

**Admin-Only Routes:**
All require `requireAdmin={true}` in `ProtectedRoute`:
- `/dashboard/admin` - Admin dashboard
- `/dashboard/admin/users` - User management
- `/dashboard/admin/review` - Approvals center
- `/dashboard/admin/verification-review` - Verification review
- `/dashboard/admin/analytics` - Admin analytics
- `/dashboard/admin/marketplace` - Marketplace management
- `/dashboard/admin/supplier-management` - Supplier management
- `/dashboard/admin/rfq-matching` - RFQ matching
- `/dashboard/admin/rfq-analytics` - RFQ analytics
- `/dashboard/admin/rfq-review` - RFQ review
- `/dashboard/admin/reviews` - Reviews management
- `/dashboard/admin/reviews-moderation` - Reviews moderation
- `/dashboard/admin/revenue` - Revenue management
- `/dashboard/admin/growth-metrics` - Growth metrics
- `/dashboard/admin/onboarding-tracker` - Onboarding tracking
- `/dashboard/admin/leads` - Marketing leads
- `/dashboard/admin/kyb` - KYB verification
- `/dashboard/admin/disputes` - Dispute management
- `/dashboard/admin/support-tickets` - Support tickets
- `/dashboard/admin/trust-engine` - Trust engine
- `/dashboard/admin/founder-control` - Founder control panel

**Risk & Compliance (Admin Only):**
- `/dashboard/risk` - Risk management
- `/dashboard/compliance` - Compliance center
- `/dashboard/kyc` - KYC tracker
- `/dashboard/anticorruption` - Anti-corruption
- `/dashboard/crisis` - Crisis management
- `/dashboard/audit` - Audit logs

### Route Guards

**ProtectedRoute (`src/components/ProtectedRoute.jsx`):**
- Checks authentication via `requireAuth()` helper
- Optional `requireOnboarding={true}` - Currently NOT enforced (parameter exists but logic checks only auth)
- Optional `requireAdmin={true}` - Checks `isAdmin()` function which:
  - Returns `true` if user email is `youba.thiam@icloud.com` (founder)
  - Returns `true` if `profile.is_admin === true`
  - Returns `false` otherwise
- Shows loading spinner during auth check
- Redirects to `/login?next={currentPath}` if not authenticated
- Shows `<AccessDenied />` component if admin check fails

**RequireDashboardRole (`src/guards/RequireDashboardRole.tsx`):**
- Uses `DashboardRoleContext` (URL-derived role)
- Normalizes `logistics_partner` → `logistics`
- If user's URL-derived role is not in `allow` array, silently redirects to that role's home
- No toasts, no errors, just silent redirect

### Default Redirects
- `/dashboard` → Redirects to role-specific dashboard (e.g., `/dashboard/buyer`)
- `*` (catch-all) → Redirects to `/auth/post-login`

### Layout Hierarchy
- **Public pages:** Wrapped in `<Layout>` component (includes Navbar + Footer)
- **Dashboard pages:** Wrapped in `<DashboardLayout>` component (includes Sidebar + Header)
- **Mobile:** Uses `<MobileLayout>` for non-dashboard routes on mobile devices
- **No layout:** Dashboard routes bypass main Layout (handled in `src/layout.jsx`)

---

## 4. Auth & Identity Model

### Authentication Flow
**Signup (`src/pages/signup.jsx`):**
1. User submits form (fullName, email, password, confirmPassword)
2. Client-side validation (email format, password strength 8+ chars, password match)
3. Calls `supabase.auth.signUp({ email, password, options: { data: { full_name } } })`
4. Supabase creates user in `auth.users` table
5. Waits for session (polls `supabase.auth.getSession()` up to 10 times, 200ms intervals)
6. On session success: navigates to `/auth/post-login`
7. On session timeout: shows message asking user to refresh

**Login (`src/pages/login.jsx`):**
1. User submits email + password
2. Calls `supabase.auth.signInWithPassword({ email, password })`
3. On success: navigates to `/auth/post-login`
4. On error: Shows user-friendly error message (handles invalid credentials, email not confirmed, rate limits)

**OAuth (Google/Facebook):**
- Uses `supabase.auth.signInWithOAuth({ provider })`
- Redirects to provider's OAuth flow
- Callback handled in `src/pages/auth-callback.jsx`
- On success: redirects to `/auth/post-login`

### Session Management
- **Storage:** Supabase stores session in `localStorage` (key: `sb-{project-id}-auth-token`)
- **Persistence:** `persistSession: true` in Supabase client config
- **Auto-refresh:** `autoRefreshToken: true` in Supabase client config
- **Manual refresh:** `useSessionRefresh` hook refreshes session every 30 minutes
- **Session expiry:** Tokens expire after 1 hour (Supabase default), auto-refreshed before expiry

### Identity Data Sources

**From Supabase Auth (`auth.users` table):**
- `id` - UUID, primary key
- `email` - User email
- `email_confirmed_at` - Email verification timestamp (optional check)
- `user_metadata.full_name` - Full name (from signup)
- `created_at` - Account creation timestamp

**From Profiles Table (`profiles` table):**
- `id` - Same as `auth.users.id` (foreign key)
- `email` - Duplicate of auth email
- `full_name` - User's full name
- `role` - User role (`'buyer'`, `'seller'`, `'hybrid'`, `'logistics'`, `'admin'`)
- `user_role` - Legacy field, same as `role`
- `company_id` - UUID reference to `companies` table
- `onboarding_completed` - Boolean flag
- `is_admin` - Boolean flag for admin access
- `phone` - User phone number
- Additional profile fields (country, city, etc.)

### Profile Creation & Self-Healing
**PostLoginRouter (`src/auth/PostLoginRouter.jsx`):**
- If profile doesn't exist, creates one with defaults:
  - `role: 'buyer'`
  - `onboarding_completed: false`
  - `company_id: null`
- Uses `upsert()` to handle race conditions
- Never shows database errors to users (silent fallback to defaults)

**Company Creation (`src/utils/companyHelper.js`):**
- `getOrCreateCompany()` function:
  - If user already has `company_id`, returns it
  - Otherwise creates new company in `companies` table
  - Sets `verified: false`, `verification_status: 'unverified'` by default
  - Updates profile with `company_id`
  - Returns `null` on error (non-blocking)

### Identity Persistence
- **Session:** Stored in `localStorage` by Supabase
- **Profile:** Fetched on-demand from `profiles` table (cached in component state)
- **Role:** Stored in `profiles.role` field, normalized throughout app
- **No client-side caching:** Profile data is fetched fresh on each route/component mount

---

## 5. Role & Permission Model

### Supported Roles
1. **buyer** - Standard buyer role
2. **seller** - Standard seller role
3. **hybrid** - Can both buy and sell (accesses both buyer and seller features)
4. **logistics** - Logistics partner (normalized from `logistics_partner`)
5. **admin** - Platform administrator

### Role Normalization
Throughout the codebase, `logistics_partner` is normalized to `logistics`:
- **Where normalization occurs:**
  - `src/utils/roleHelpers.js` - `getUserRole()` function
  - `src/context/RoleContext.tsx` - `normalizeRole()` function
  - `src/context/DashboardRoleContext.tsx` - `normalizeRoleFromPath()` function
  - `src/guards/RequireDashboardRole.tsx` - Before access check
  - `src/pages/dashboard/index.jsx` - During role verification
  - `src/auth/PostLoginRouter.jsx` - Before routing decision
  - `src/layouts/DashboardLayout.jsx` - Dev role switcher

- **Storage:** Database stores normalized value (`logistics`, not `logistics_partner`)
- **Consistency:** All role checks use normalized values

### Role Sources (Authoritative Order)
1. **URL path** (`DashboardRoleContext`) - Primary source for dashboard pages (derived from `/dashboard/{role}`)
2. **Profile `role` field** (`profiles.role`) - Authoritative source for user's actual role
3. **Profile `user_role` field** - Legacy field, used as fallback
4. **Default:** `'buyer'` if no role found

### Role Enforcement Components

**ProtectedRoute (`src/components/ProtectedRoute.jsx`):**
- Checks authentication only
- Optional `requireAdmin={true}` prop checks `isAdmin()` function

**RequireDashboardRole (`src/guards/RequireDashboardRole.tsx`):**
- Uses URL-derived role from `DashboardRoleContext`
- Normalizes role before checking
- If role not in `allow` array, silently redirects
- Used by individual dashboard feature pages

**Dashboard Component (`src/pages/dashboard/index.jsx`):**
- Checks profile role matches URL path role
- Allows founder/CEO to bypass role checks (for dev switcher)
- Allows hybrid users to access both buyer and seller routes
- Redirects to `/auth/post-login` on mismatch

**PostLoginRouter (`src/auth/PostLoginRouter.jsx`):**
- Reads role from `profiles.role`
- Normalizes `logistics_partner` → `logistics`
- Routes to role-specific dashboard based on role value

### Admin Permissions

**Admin Check (`src/utils/permissions.js`):**
```javascript
isAdmin(user, profile) {
  // Founder always admin
  if (user?.email?.toLowerCase() === 'youba.thiam@icloud.com') return true;
  // Check database flag
  if (profile?.is_admin === true) return true;
  // Legacy check (backward compatibility)
  if (user.user_metadata?.role === "admin") return true;
  return false;
}
```

**Admin Access:**
- All `/dashboard/admin/*` routes require `requireAdmin={true}`
- Admin can access any dashboard (buyer, seller, hybrid, logistics) via dev switcher (founder only)
- Risk & Compliance routes (`/dashboard/risk`, `/dashboard/compliance`, etc.) require admin

### Founder/CEO Special Privileges
**Email:** `youba.thiam@icloud.com`

**Special Access:**
- Always treated as admin (bypasses `is_admin` flag check)
- Can use dev role switcher (visible in bottom-right of dashboard)
- Can access any dashboard regardless of profile role
- Dev role switcher works in production (not just dev mode)
- Admin panel link visible in sidebar from any role dashboard

---

## 6. Dashboard System

### Buyer Dashboard

**Entry Route:** `/dashboard/buyer`  
**Required Role:** `'buyer'` or `'hybrid'` (hybrid users can access buyer routes)  
**Layout:** `DashboardLayout` with `currentRole="buyer"`  
**Home Component:** `BuyerHome` → renders `DashboardHome` with `currentRole="buyer"`  
**Data Dependencies:**
- Fetches orders filtered by `user_id` or `company_id`
- Fetches RFQs where user is buyer
- Fetches recent messages
- Fetches KPIs (total orders, RFQs, saved products)
- Fetches activity metrics (search appearances, buyer interest)

**Guard Logic:**
- `Dashboard` component checks: `normalizedRole === 'buyer' || (normalizedRole === 'hybrid' && pathRole === 'buyer')`
- `RequireDashboardRole` guard on sub-routes: `allow={['buyer', 'hybrid']}`

**Redirect Behavior:**
- Base `/dashboard` redirects to `/dashboard/buyer` if role is `'buyer'`
- Role mismatch redirects to `/auth/post-login`

### Seller Dashboard

**Entry Route:** `/dashboard/seller`  
**Required Role:** `'seller'` or `'hybrid'` (hybrid users can access seller routes)  
**Layout:** `DashboardLayout` with `currentRole="seller"`  
**Home Component:** `SellerHome` → renders `DashboardHome` with `currentRole="seller"`  
**Data Dependencies:**
- Fetches products filtered by `company_id`
- Fetches sales/orders where user is seller
- Fetches RFQs received (matching seller's product categories)
- Fetches analytics (sales charts, performance metrics)
- Fetches verification status

**Guard Logic:**
- `Dashboard` component checks: `normalizedRole === 'seller' || (normalizedRole === 'hybrid' && pathRole === 'seller')`
- `RequireDashboardRole` guard on sub-routes: `allow={['seller', 'hybrid']}`

**Redirect Behavior:**
- Base `/dashboard` redirects to `/dashboard/seller` if role is `'seller'`
- Role mismatch redirects to `/auth/post-login`

### Hybrid Dashboard

**Entry Route:** `/dashboard/hybrid`  
**Required Role:** `'hybrid'`  
**Layout:** `DashboardLayout` with `currentRole="hybrid"`  
**Home Component:** `HybridHome` → renders `DashboardHome` with `currentRole="hybrid"`  
**Data Dependencies:**
- Combines buyer and seller data
- Fetches both buyer orders and seller sales
- Fetches both sent and received RFQs
- Fetches both buyer and seller analytics
- Uses `activeView` prop to filter data ('all', 'buyer', 'seller')

**Guard Logic:**
- `Dashboard` component checks: `normalizedRole === 'hybrid'`
- Hybrid users can access `/dashboard/buyer` and `/dashboard/seller` routes (explicitly allowed)

**Redirect Behavior:**
- Base `/dashboard` redirects to `/dashboard/hybrid` if role is `'hybrid'`
- Role mismatch redirects to `/auth/post-login`

### Logistics Dashboard

**Entry Route:** `/dashboard/logistics`  
**Required Role:** `'logistics'` (normalized from `'logistics_partner'`)  
**Layout:** `DashboardLayout` with `currentRole="logistics"`  
**Home Component:** `LogisticsHome` → renders `LogisticsDashboard` component  
**Data Dependencies:**
- Fetches shipments filtered by `logistics_partner_id = company_id`
- Fetches KPIs (active shipments, in transit, delivered, revenue)
- Fetches recent shipments
- Fetches logistics partners
- Requires `company_id` to be set (shows toast if missing)

**Guard Logic:**
- `Dashboard` component checks: `normalizedRole === 'logistics'`
- Founder/CEO can access even if role doesn't match (for dev switcher testing)
- `RequireDashboardRole` guard: `allow={['logistics']}`

**Redirect Behavior:**
- Base `/dashboard` redirects to `/dashboard/logistics` if role is `'logistics'`
- Role mismatch redirects to `/auth/post-login` (except for founder)
- Special handling: Founder can access logistics dashboard even with different role (dev switcher)

### Admin Dashboard

**Entry Route:** `/dashboard/admin`  
**Required Role:** Admin (checked via `isAdmin()` function)  
**Layout:** `DashboardLayout` with `currentRole="admin"`  
**Home Component:** `AdminDashboard` (lazy-loaded)  
**Data Dependencies:**
- Fetches all users (no filtering)
- Fetches all companies (no filtering)
- Fetches platform-wide analytics
- Fetches pending approvals
- Fetches risk & compliance data

**Guard Logic:**
- `ProtectedRoute` with `requireAdmin={true}` checks `isAdmin()` function
- Shows `<AccessDenied />` if not admin
- No role-based routing logic (admin is not a "role" in the normal sense)

**Redirect Behavior:**
- Non-admins are shown access denied page (not redirected)
- Founder always has admin access regardless of profile role

---

## 7. Onboarding & First-Time User Flow

### Onboarding Tracking
**Field:** `profiles.onboarding_completed` (boolean)  
**Location:** `profiles` table  
**Default:** `false` (set on profile creation)

### Onboarding Flow

**Step 1: Signup (`src/pages/signup.jsx`)**
- User creates account via email/password or OAuth
- Profile is created (or self-healed in PostLoginRouter) with `onboarding_completed: false`
- User is redirected to `/auth/post-login`

**Step 2: PostLoginRouter Check (`src/auth/PostLoginRouter.jsx`)**
- Checks `profile.onboarding_completed`
- If `false`: Redirects to `/dashboard` (which shows RoleSelection component)
- If `true`: Redirects to role-specific dashboard

**Step 3: Role Selection (`src/components/dashboard/RoleSelection.jsx`)**
- User sees 4 role options: Buyer, Seller, Hybrid, Logistics Partner
- User selects a role
- On submit:
  - Creates company in `companies` table (if needed)
  - Updates profile with:
    - `role: selectedRole`
    - `onboarding_completed: true`
    - `company_id: companyId` (if created)
  - Redirects to role-specific dashboard

**Step 4: Dashboard Access**
- User can now access dashboard
- `onboarding_completed: true` allows full dashboard access

### Onboarding Gates

**ProtectedRoute:**
- `requireOnboarding={true}` prop exists but is **NOT currently enforced**
- Code comment says "Onboarding is no longer required anywhere. We only check auth."
- Actual behavior: Only checks authentication, ignores onboarding status

**Dashboard Component:**
- Checks `onboarding_completed` flag
- If `false` or `null`: Shows `RoleSelection` component
- If `true`: Shows dashboard content

**PostLoginRouter:**
- If `onboarding_completed: false`: Redirects to `/dashboard` (triggers role selection)
- If `onboarding_completed: true`: Routes to role-specific dashboard

### Onboarding Completion
- Set in `RoleSelection` component when user selects role
- Set in dev role switcher (automatically sets `onboarding_completed: true` when switching roles)
- Once set to `true`, user never sees role selection again (unless profile is reset)

---

## 8. State Management

### Global State (Context API)

**RoleContext (`src/context/RoleContext.tsx`):**
- Provides user's profile role (from database)
- Functions: `useRole()`, `refreshRole()`
- Normalizes `logistics_partner` → `logistics`
- Used by: Dashboard components, navigation logic

**DashboardRoleContext (`src/context/DashboardRoleContext.tsx`):**
- Provides URL-derived role (from pathname)
- Functions: `useDashboardRole()`
- Normalizes role from URL path
- Used by: `RequireDashboardRole` guard, dashboard feature pages

**LanguageContext (`src/i18n/LanguageContext.jsx`):**
- Provides current language (en, fr, ar, pt)
- Functions: `useLanguage()`
- Persists language preference

**CurrencyContext (`src/contexts/CurrencyContext.jsx`):**
- Provides current currency
- Functions: Currency conversion utilities

**DashboardContext (`src/contexts/DashboardContext.jsx`):**
- Provides dashboard-wide state (if used)
- Wrapper component for dashboard pages

### Local State Patterns

**Component State:**
- Each page/component manages its own state (React `useState`)
- Data fetching happens in `useEffect` hooks
- No global state management library (Redux, Zustand, etc.)

**State Duplication:**
- User data is fetched in multiple places:
  - `DashboardLayout` fetches user/profile
  - `DashboardHome` fetches user/profile
  - Individual pages fetch user/profile
- No shared user state cache (each component fetches independently)

**State Derivation:**
- Role is derived from multiple sources (profile, URL, context)
- `effectiveRole` in Dashboard component respects URL hint over profile role
- Admin status is computed from email + profile flag (not cached)

---

## 9. Data Access Layer

### Supabase Client (`src/api/supabaseClient.js`)
- **Singleton pattern:** Single client instance exported as `supabase`
- **Configuration:**
  - `persistSession: true` - Stores session in localStorage
  - `autoRefreshToken: true` - Auto-refreshes tokens
  - `detectSessionInUrl: true` - Handles OAuth callbacks
- **Environment variables:**
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anon key
  - Validates env vars at initialization, logs warnings if missing

### Query Patterns

**Direct Queries:**
- Most components use `supabase.from('table').select()` directly
- Filters applied via `.eq()`, `.in()`, `.gte()`, etc.
- Error handling via try/catch or `.error` property

**Helper Functions:**
- `getCurrentUserAndRole()` - Fetches user + profile + role + companyId
- `getOrCreateCompany()` - Creates company if missing
- `requireAuth()` - Checks session validity
- `isAdmin()` - Checks admin status

**Query Location:**
- Queries are in component files (not centralized)
- Some shared queries in `src/lib/supabaseQueries/` directory
- No query caching layer (each component fetches independently)

### Error Handling

**Supabase Error Handler (`src/utils/supabaseErrorHandler.js`):**
- `handleSupabaseError()` - Maps error codes to user-friendly messages
- `safeSupabaseQuery()` - Wrapper with error handling
- **Special handling:** Suppresses email confirmation errors globally (non-fatal)

**Common Error Patterns:**
- `PGRST116` - No rows returned (treated as empty result, not error)
- `42501` - Insufficient privilege (RLS blocked, shows access denied)
- `23505` - Unique violation (shows "already exists" message)
- Network errors - Shows "connection error" message

**Error Suppression:**
- Email confirmation errors are suppressed globally (logged but not shown to users)
- Database trigger errors during signup are suppressed (non-blocking)
- Profile creation errors fall back to defaults (non-blocking)

### RLS Assumptions

**Row Level Security:**
- All tables assume RLS policies are enabled
- Queries filter by `user_id` or `company_id` to match RLS policies
- Admin queries may bypass RLS (assumes service role or admin policies)

**Data Isolation:**
- Users only see their own data (filtered by `user_id` or `company_id`)
- Companies are isolated by `owner_email` or `company_id`
- Admin queries use no filters (assumes admin RLS policies allow all rows)

**Known RLS Issues:**
- Notifications table had RLS policy issues (fixed via migration)
- Profile queries assume RLS allows users to read their own profile
- Company queries assume RLS allows users to read their own company

---

## 10. Dev & Admin Tooling

### Dev Role Switcher (`src/layouts/DashboardLayout.jsx`)

**Visibility:**
- Only visible to founder (`youba.thiam@icloud.com`)
- Shown in fixed bottom-right panel
- Hidden for all other users

**Functionality:**
- Dropdown to select role: buyer, seller, hybrid, logistics, admin
- "Apply" button to switch roles
- Updates `profiles.role` and `profiles.user_role` in database
- Sets `onboarding_completed: true` automatically
- Waits 100ms after database update before navigating (prevents race condition)
- Navigates to role-specific dashboard
- Shows toast success message

**Database Updates:**
- Only works if user is founder OR `import.meta.env.DEV === true`
- Founder can use in production (not just dev mode)
- Updates both `role` and `user_role` fields for consistency

**State Management:**
- Updates local `userRole` state immediately (for UI)
- Updates `devSelectedRole` state (for dropdown)
- Calls `refreshRole()` to sync RoleContext
- Normalizes `logistics_partner` → `logistics` before updating

### Admin Overrides

**Founder Email:** `youba.thiam@icloud.com`

**Overrides:**
- Always treated as admin (bypasses `is_admin` flag)
- Can access any dashboard via dev switcher
- Admin panel link visible in sidebar from any role
- Dev role switcher works in production

**Admin Panel Access:**
- Link appears in sidebar for founder (when not on admin dashboard)
- Route: `/dashboard/admin`
- Protected by `requireAdmin={true}` (founder always passes)

### DEV vs PROD Behavior Differences

**Environment Detection:**
- `import.meta.env.DEV` - Development mode
- `import.meta.env.PROD` - Production mode
- `import.meta.env.MODE` - Current mode (development/production)

**Dev-Only Features:**
- Dev role switcher (founder can use in production too)
- Console logging (more verbose in dev)
- Error details shown in ErrorBoundary (dev only)
- Test email utility (`src/utils/testEmailService.js`) loaded in dev

**Production-Only:**
- Cache-busting headers (Vercel config)
- Sentry error tracking (only if configured)
- GA4 analytics (only if configured)
- Performance tracking

---

## 11. UI Structure

### Layout Hierarchy

**Main Layout (`src/layout.jsx`):**
- Wraps all non-dashboard routes
- Includes: Navbar, Footer, WhatsApp button, Cookie banner, Newsletter popup
- Conditionally renders `MobileLayout` on mobile devices
- Dashboard routes bypass this layout (return children directly)

**Dashboard Layout (`src/layouts/DashboardLayout.jsx`):**
- Wraps all dashboard routes
- Includes: Sidebar (collapsible), Header (role-specific), Main content area
- Sidebar menu items come from navigation config files:
  - `src/config/navigation/buyerNav.ts`
  - `src/config/navigation/sellerNav.ts`
  - `src/config/navigation/hybridNav.ts`
  - `src/config/navigation/logisticsNav.ts`
- Admin menu items defined inline in `DashboardLayout`

**Mobile Layout (`src/layouts/MobileLayout.tsx`):**
- Used for non-dashboard routes on mobile
- Includes mobile header and bottom navigation
- Lazy-loaded component

### Reusable Components

**UI Components (`src/components/ui/`):**
- Button, Input, Label, Card, Badge, Select, Textarea, Dialog, etc.
- All use TailwindCSS with Afrikoni design system colors
- Consistent styling across app

**Dashboard Components (`src/components/dashboard/`):**
- `RoleSelection` - Role selection UI
- `DashboardHeader` - Dashboard header (role-specific)
- `DashboardSidebar` - Sidebar navigation
- `MobileBottomNav` - Mobile bottom navigation
- `OnboardingProgressTracker` - Onboarding progress UI

### Mobile-Specific Logic

**Responsive Design:**
- TailwindCSS breakpoints (sm, md, lg, xl)
- Mobile-first approach
- Sidebar collapses to hamburger menu on mobile
- Bottom navigation on mobile (non-dashboard routes)

**Conditional Rendering:**
- `window.innerWidth < 768` - Mobile breakpoint
- Mobile layout used for non-dashboard routes
- Dashboard uses responsive sidebar (collapses on mobile)

### Conditional Rendering Patterns

**Role-Based:**
- Menu items filtered by role
- Feature visibility based on role checks
- Data loading based on role (buyer vs seller data)

**Admin-Only:**
- Admin menu items filtered by `isAdmin()` check
- Risk & Compliance routes only visible to admins
- Admin panel link only for founder

**Onboarding-Based:**
- RoleSelection shown if `onboarding_completed: false`
- Dashboard content shown if `onboarding_completed: true`

---

## 12. Cross-Cutting Concerns

### Logging

**Console Logging:**
- Development: Verbose logging
- Production: Minimal logging (errors only)
- Pattern: `console.log('[Component] message')` for debugging
- Pattern: `console.warn('[Component] warning')` for warnings
- Pattern: `console.error('[Component] error')` for errors

**Error Tracking:**
- Sentry integration (`src/utils/sentry.js`)
- ErrorBoundary catches React errors and sends to Sentry
- Manual error tracking: `captureException()` calls

**Audit Logging (`src/utils/auditLogger.js`):**
- Logs critical actions (payments, disputes, verifications, admin actions)
- Includes IP address, country, risk level, actor type
- Stored in `audit_logs` table
- Functions: `logAuditEvent()`, `logPaymentEvent()`, `logDisputeEvent()`, `logVerificationEvent()`, `logAdminEvent()`, `logLoginEvent()`, `logLogoutEvent()`

### Error Boundaries

**ErrorBoundary Component (`src/components/ErrorBoundary.jsx`):**
- Catches React component errors
- Shows user-friendly error UI
- Logs errors to Sentry
- Provides "Retry" and "Go Home" buttons
- Shows error details in dev mode only

**Usage:**
- Wraps entire app in `main.jsx`
- Wraps dashboard content in `Dashboard` component
- Individual pages can have their own error boundaries

### Loading States

**Patterns:**
- Spinner components (`PageLoader`, skeleton loaders)
- `isLoading` state in components
- Loading state shown during data fetches
- Skeleton screens for better UX

**Common Loading States:**
- Auth check: Spinner in ProtectedRoute
- Dashboard init: Spinner in Dashboard component
- Data fetch: Loading state in individual pages
- Form submission: Disabled button + spinner

### Redirect Loop Prevention

**Mechanisms:**
1. **PostLoginRouter:** Single source of truth for post-login routing (prevents multiple redirects)
2. **Role verification delays:** 200ms delay before redirecting on role mismatch (allows DB updates to propagate)
3. **Replace navigation:** Uses `navigate(path, { replace: true })` to prevent history stack issues
4. **Mount checks:** `isMounted` flags prevent state updates after unmount
5. **Conditional redirects:** Only redirects if condition actually changed (not on every render)

**Known Race Conditions:**
- Dev role switcher → Dashboard component role check (fixed with 100ms delay)
- Profile update → PostLoginRouter profile fetch (fixed with upsert + retry)

---

## 13. Known Constraints & Invariants

### Critical Invariants

1. **Profile ID = Auth User ID:**
   - `profiles.id` MUST equal `auth.users.id`
   - Foreign key constraint in database
   - Profile creation uses `upsert` with `onConflict: 'id'` to handle race conditions

2. **Role Normalization:**
   - `logistics_partner` MUST be normalized to `logistics` everywhere
   - Database stores normalized value
   - All role checks use normalized values

3. **Onboarding Flag:**
   - `onboarding_completed: false` → Shows RoleSelection
   - `onboarding_completed: true` → Shows dashboard
   - Once set to `true`, user never sees role selection again (unless profile reset)

4. **Founder Email:**
   - `youba.thiam@icloud.com` MUST always have admin access
   - Hardcoded in `isAdmin()` function
   - Cannot be changed without code update

5. **Dashboard Role Context:**
   - URL path is primary source of truth for `DashboardRoleContext`
   - Profile role is authoritative for routing decisions
   - URL role and profile role must match (except for founder/dev switcher)

6. **Company Creation:**
   - All new companies start with `verified: false`, `verification_status: 'unverified'`
   - Only admins can change verification status
   - Verified suppliers appear on `/suppliers` page

7. **Session Persistence:**
   - Supabase session stored in localStorage
   - Session auto-refreshes before expiry
   - Session check happens on every protected route

### Hidden Coupling

1. **Dashboard Component ↔ PostLoginRouter:**
   - Dashboard assumes PostLoginRouter handles initial routing
   - If PostLoginRouter fails, Dashboard shows role selection
   - Both check `onboarding_completed` flag

2. **RoleContext ↔ DashboardRoleContext:**
   - RoleContext provides profile role (database)
   - DashboardRoleContext provides URL role (pathname)
   - Both must be in sync for correct behavior
   - Dashboard component reconciles both

3. **ProtectedRoute ↔ Dashboard:**
   - ProtectedRoute checks auth
   - Dashboard checks role + onboarding
   - Both must pass for dashboard access

4. **Company ID ↔ Profile:**
   - Many queries filter by `company_id`
   - Profile must have `company_id` set for queries to work
   - `getOrCreateCompany()` ensures company exists
   - RLS policies assume `company_id` is set

5. **Navigation Config ↔ DashboardLayout:**
   - Navigation config files define menu structure
   - DashboardLayout reads config based on role
   - Menu structure changes require config file updates

---

## 14. Risk Zones

### Timing-Sensitive Logic

1. **Session Creation → Redirect:**
   - Signup creates session, but session may not be immediately available
   - Fixed with polling loop (10 retries, 200ms intervals)
   - Risk: If Supabase is slow, redirect may fail

2. **Dev Role Switcher → Dashboard Role Check:**
   - Database update happens, then navigation
   - Dashboard component checks role before update propagates
   - Fixed with 100ms delay after database update
   - Risk: If database is slow, role check may still fail

3. **Profile Creation → Profile Fetch:**
   - PostLoginRouter creates profile, then fetches it
   - Uses `upsert` to handle race conditions
   - Risk: If database is slow, fetch may return old data

### Role-Dependent Flows

1. **Role Mismatch Handling:**
   - User's profile role doesn't match URL role
   - Dashboard redirects to PostLoginRouter
   - PostLoginRouter redirects based on profile role
   - Risk: Redirect loops if role never matches

2. **Hybrid Role Access:**
   - Hybrid users can access both buyer and seller routes
   - Logic in Dashboard component explicitly allows this
   - Risk: If logic changes, hybrid users may lose access

3. **Founder Dev Switcher:**
   - Founder can access any dashboard regardless of profile role
   - Special case in Dashboard component
   - Risk: If special case is removed, founder loses dev switcher access

### Data Access Patterns

1. **Company ID Dependency:**
   - Many queries require `company_id` to be set
   - If `company_id` is null, queries may fail or return no data
   - Risk: Users without companies may see empty dashboards

2. **RLS Policy Assumptions:**
   - Code assumes RLS policies are correctly configured
   - If RLS policies change, queries may fail
   - Risk: 403 errors if RLS policies don't match query filters

3. **Data Isolation:**
   - Queries filter by `user_id` or `company_id`
   - If filters are missing, users may see other users' data
   - Risk: Data leaks if filters are accidentally removed

### State Management Risks

1. **State Duplication:**
   - User data fetched in multiple places
   - No shared cache
   - Risk: Stale data if updates happen in one place but not others

2. **Role State Sync:**
   - Role stored in multiple places (profile, URL, context)
   - Must be kept in sync
   - Risk: UI shows wrong role if state gets out of sync

---

## 15. Update-Safety Map

### SAFE to Update Freely

**UI/UX Changes:**
- Component styling (TailwindCSS classes)
- Layout spacing, colors, fonts
- Button text, labels, placeholders
- Loading spinners, skeleton screens
- Error messages (user-facing text)

**Non-Critical Features:**
- Help center content
- About page content
- Legal pages (privacy, terms)
- Footer links
- Social media links

**Configuration Files:**
- Navigation config files (`buyerNav.ts`, `sellerNav.ts`, etc.) - Menu structure changes
- Translation files (`en.json`, `fr.json`, etc.)
- Design system colors (if consistent)

### REQUIRES Caution

**Auth Flow:**
- Signup/login logic
- Session management
- Profile creation
- OAuth callbacks
- **Test:** Full signup → login → dashboard flow

**Role System:**
- Role normalization logic
- Role checks in Dashboard component
- RequireDashboardRole guard
- PostLoginRouter routing logic
- **Test:** Role switching, role-based access, hybrid access

**Dashboard Routing:**
- Dashboard component role verification
- PostLoginRouter redirect logic
- ProtectedRoute guards
- **Test:** All role dashboards, redirect flows, onboarding flow

**Data Queries:**
- Supabase query filters
- RLS policy assumptions
- Company ID dependencies
- **Test:** Data isolation, empty states, error handling

**Onboarding:**
- RoleSelection component
- Onboarding completion logic
- Profile update logic
- **Test:** New user signup, role selection, dashboard access

### Should NOT be Touched Without Full Regression Testing

**Core Auth:**
- `src/api/supabaseClient.js` - Supabase client configuration
- `src/utils/authHelpers.js` - Core auth functions
- `src/auth/PostLoginRouter.jsx` - Post-login routing
- Session persistence logic
- **Impact:** All authenticated routes may break

**Role System:**
- `src/utils/roleHelpers.js` - Role normalization
- `src/context/RoleContext.tsx` - Role context
- `src/context/DashboardRoleContext.tsx` - Dashboard role context
- `src/pages/dashboard/index.jsx` - Dashboard role verification
- **Impact:** All role-based access may break

**Founder/Admin Logic:**
- `src/utils/permissions.js` - Admin check
- Founder email hardcoding
- Dev role switcher
- **Impact:** Admin access, dev tools may break

**Profile/Company Creation:**
- `src/utils/companyHelper.js` - Company creation
- Profile self-healing in PostLoginRouter
- **Impact:** New user signup may fail

**Protected Routes:**
- `src/components/ProtectedRoute.jsx` - Route guards
- `src/guards/RequireDashboardRole.tsx` - Role guards
- **Impact:** All protected routes may break

---

## 16. Mental Model (5-Minute Explanation)

### How the App Works (Plain English)

**Afrikoni is a B2B marketplace where African suppliers sell products to global buyers. Here's how it works:**

1. **User Signs Up:**
   - User creates account (email/password or Google/Facebook)
   - Supabase creates user in database
   - System creates a profile record (or "self-heals" if missing)
   - User is redirected to role selection

2. **User Selects Role:**
   - User chooses: Buyer, Seller, Hybrid (both), or Logistics Partner
   - System creates a company record
   - Profile is updated with role and `onboarding_completed: true`
   - User is redirected to their role-specific dashboard

3. **Dashboard Access:**
   - Dashboard checks: Is user logged in? Has role? Completed onboarding?
   - If all good: Shows dashboard content
   - If not: Shows role selection or redirects to login

4. **Role-Based Experience:**
   - **Buyers** see: Orders, RFQs, Products to buy, Payments
   - **Sellers** see: Products to sell, Sales, Orders received, Analytics
   - **Hybrid** users see: Both buyer and seller features
   - **Logistics** users see: Shipments, Fulfillment, Logistics tools
   - **Admins** see: Everything (user management, analytics, approvals)

5. **Data Isolation:**
   - Each user only sees their own data
   - Queries filter by `user_id` or `company_id`
   - Database RLS policies enforce this at the database level

6. **Special Cases:**
   - Founder (`youba.thiam@icloud.com`) is always an admin
   - Founder can use dev role switcher to test any dashboard
   - Hybrid users can access both buyer and seller routes

7. **Routing Flow:**
   - After login: Always goes through `/auth/post-login`
   - PostLoginRouter checks profile role and routes accordingly
   - Dashboard component verifies role matches URL
   - If mismatch: Redirects back to PostLoginRouter (prevents loops)

**Key Principle:** The profile's `role` field is the source of truth. The URL path indicates which dashboard to show, but it must match the profile role (unless you're the founder using dev tools).

**Critical Path:** Signup → Profile Creation → Role Selection → Dashboard Access → Data Fetching (filtered by user/company)

---

## 17. Known Database Performance Issues (Technical Debt)

### RLS Policy Performance Warnings

Supabase advisors have identified performance issues with Row Level Security (RLS) policies:

#### Issue Type 1: Auth RLS Initialization Plan

**Problem:** Multiple RLS policies re-evaluate `auth.uid()` or `current_setting()` for each row instead of once per query, causing suboptimal performance at scale.

**Affected Tables & Policies:**
- `profiles`: "Users can view own profile", "Users can insert own profile", "Users can update own profile"
- `orders`: "admin_orders"
- `products`: "supplier_read_own_products", "supplier_update_own_products"
- `reviews`: "Buyers can view their own reviews", "Sellers can view approved reviews about them", "Buyers can create reviews for completed orders", "Admins have full access to reviews"
- `decision_audit_log`: "Only admins can read decision_audit_log", "Only admins can insert decision_audit_log"
- `contact_submissions`: "Admins can view all submissions"

**Fix Required:** Replace `auth.uid()` with `(select auth.uid())` in policy expressions.

**Impact:** Performance degradation at scale (more rows = more function calls).

#### Issue Type 2: Multiple Permissive Policies

**Problem:** Tables have multiple permissive policies for the same role and action, requiring PostgreSQL to evaluate all policies for every query.

**Affected Tables:**
- `contact_submissions`: Multiple SELECT policies for `authenticated` role
- `orders`: Multiple SELECT policies (4+ policies overlap)
- `products`: Multiple SELECT and UPDATE policies across multiple roles
- `reviews`: Multiple INSERT and SELECT policies across multiple roles
- `rfqs`: Multiple SELECT policies
- `shipments`: Multiple SELECT policies

**Fix Required:** Consolidate overlapping policies into single policies with combined conditions (using OR/AND logic).

**Impact:** Query performance degrades with more policies (each policy must be evaluated).

### Current Status

- **Severity:** WARN (not errors, but performance warnings)
- **Priority:** Medium (affects performance at scale, not functionality)
- **Action Required:** Database migration to optimize RLS policies
- **Documentation:** See Supabase docs: https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select

### Notes

- These are **database-level optimizations**, not frontend code changes
- Current functionality works correctly (policies are secure)
- Performance impact increases with data volume
- Fixes should be tested thoroughly as they modify security policies

---

## End of Audit

This document describes the system **exactly as it exists today**. Use it as a reference when making changes to ensure you understand the full impact of your modifications.

**Last Updated:** 2025-01-XX  
**Codebase Version:** As of latest commit
**Database Performance Warnings:** 12 Auth RLS InitPlan issues, 28 Multiple Permissive Policies issues (as of latest Supabase advisor scan)

