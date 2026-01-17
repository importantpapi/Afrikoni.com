# Complete Dashboard Forensic Analysis - Routes, Auth, Data Flow

## 📋 Executive Summary

This document provides a comprehensive forensic analysis of the Afrikoni dashboard system, including all routes, pages, authentication flow, capability system, data flow, and backend connections.

**Status:** ✅ **COMPLETE ANALYSIS**

---

## 🗺️ Route Structure Overview

### Route Hierarchy

```
App.jsx (Root)
├── Public Routes (/)
│   ├── Home (/)
│   ├── Login (/login)
│   ├── Signup (/signup)
│   └── ... (public pages)
│
├── Auth Routes (/auth/*)
│   ├── Callback (/auth/callback) - OAuth callback
│   └── Post-Login Router (/auth/post-login) - Post-login routing logic
│
├── Onboarding Routes (/onboarding/*)
│   └── Company Onboarding (/onboarding/company) - ProtectedRoute
│
└── Dashboard Routes (/dashboard/*) ⭐ MAIN FOCUS
    ├── CapabilityProvider (wraps all dashboard routes)
    ├── RequireCapability (route guard)
    ├── Dashboard (shell component)
    │   └── WorkspaceDashboard (persistent layout)
    │       └── DashboardLayout (sidebar + header)
    │           └── <Outlet /> (child routes render here)
    │
    ├── Dashboard Home (/dashboard) - index route
    ├── Core Pages
    │   ├── Orders (/dashboard/orders)
    │   ├── RFQs (/dashboard/rfqs)
    │   ├── RFQs New (/dashboard/rfqs/new)
    │   ├── Products (/dashboard/products)
    │   ├── Sales (/dashboard/sales)
    │   ├── Payments (/dashboard/payments)
    │   └── Settings (/dashboard/settings)
    │
    └── Admin Routes (/dashboard/admin/*)
        ├── Users (/dashboard/admin/users)
        ├── Analytics (/dashboard/admin/analytics)
        ├── Review (/dashboard/admin/review)
        ├── Disputes (/dashboard/admin/disputes)
        ├── Support Tickets (/dashboard/admin/support-tickets)
        ├── Marketplace (/dashboard/admin/marketplace)
        ├── Onboarding Tracker (/dashboard/admin/onboarding-tracker)
        ├── Revenue (/dashboard/admin/revenue)
        ├── RFQ Matching (/dashboard/admin/rfq-matching)
        ├── RFQ Analytics (/dashboard/admin/rfq-analytics)
        ├── Supplier Management (/dashboard/admin/supplier-management)
        ├── Growth Metrics (/dashboard/admin/growth-metrics)
        ├── Trade Intelligence (/dashboard/admin/trade-intelligence)
        ├── KYB (/dashboard/admin/kyb)
        ├── Verification Review (/dashboard/admin/verification-review)
        ├── Reviews (/dashboard/admin/reviews)
        ├── Reviews Moderation (/dashboard/admin/reviews-moderation)
        ├── Trust Engine (/dashboard/admin/trust-engine)
        ├── RFQ Review (/dashboard/admin/rfq-review)
        ├── Leads (/dashboard/admin/leads)
        └── Founder Control Panel (/dashboard/admin/founder-control)
```

---

## 📊 Dashboard Pages Inventory

### ✅ ROUTED PAGES (Connected to Routes)

#### Core Dashboard Pages (8 pages)
1. ✅ **DashboardHome** (`/dashboard`)
   - **File:** `src/pages/dashboard/DashboardHome.jsx`
   - **Route:** `<Route index element={<DashboardHome />} />`
   - **Status:** ✅ Connected
   - **Auth:** Requires capabilities.ready
   - **Capabilities:** Uses `useCapability()` hook

2. ✅ **Orders** (`/dashboard/orders`)
   - **File:** `src/pages/dashboard/orders.jsx`
   - **Route:** `<Route path="orders" element={<OrdersPage />} />`
   - **Status:** ✅ Connected
   - **Auth:** Requires capabilities.ready
   - **Capabilities:** Uses `useCapability()` hook

3. ✅ **RFQs** (`/dashboard/rfqs`)
   - **File:** `src/pages/dashboard/rfqs.jsx`
   - **Route:** `<Route path="rfqs" element={<RFQsPage />} />`
   - **Status:** ✅ Connected
   - **Auth:** Requires capabilities.ready
   - **Capabilities:** Uses `useCapability()` hook

4. ✅ **RFQs New** (`/dashboard/rfqs/new`)
   - **File:** `src/pages/dashboard/rfqs/new.jsx`
   - **Route:** `<Route path="rfqs/new" element={<RFQsNewPage />} />`
   - **Status:** ✅ Connected
   - **Auth:** Requires capabilities.ready

5. ✅ **Products** (`/dashboard/products`)
   - **File:** `src/pages/dashboard/products.jsx`
   - **Route:** `<Route path="products" element={<ProductsPage />} />`
   - **Status:** ✅ Connected
   - **Auth:** Requires capabilities.ready
   - **Capabilities:** Uses `useCapability()` hook

6. ✅ **Sales** (`/dashboard/sales`)
   - **File:** `src/pages/dashboard/sales.jsx`
   - **Route:** `<Route path="sales" element={<SalesPage />} />`
   - **Status:** ✅ Connected
   - **Auth:** Requires capabilities.ready

7. ✅ **Payments** (`/dashboard/payments`)
   - **File:** `src/pages/dashboard/payments.jsx`
   - **Route:** `<Route path="payments" element={<PaymentsPage />} />`
   - **Status:** ✅ Connected
   - **Auth:** Requires capabilities.ready

8. ✅ **Settings** (`/dashboard/settings`)
   - **File:** `src/pages/dashboard/settings.jsx`
   - **Route:** `<Route path="settings" element={<SettingsPage />} />`
   - **Status:** ✅ Connected
   - **Auth:** Requires capabilities.ready

#### Admin Pages (18 pages)
9. ✅ **Admin Users** (`/dashboard/admin/users`)
   - **File:** `src/pages/dashboard/admin/users.jsx`
   - **Route:** `<Route path="admin/users" element={<ProtectedRoute requireAdmin={true}><AdminUsersPage /></ProtectedRoute>} />`
   - **Status:** ✅ Connected
   - **Auth:** Requires admin access

10. ✅ **Admin Analytics** (`/dashboard/admin/analytics`)
    - **File:** `src/pages/dashboard/admin/analytics.jsx`
    - **Route:** `<Route path="admin/analytics" element={<ProtectedRoute requireAdmin={true}><AdminAnalyticsPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

11. ✅ **Admin Review** (`/dashboard/admin/review`)
    - **File:** `src/pages/dashboard/admin/review.jsx`
    - **Route:** `<Route path="admin/review" element={<ProtectedRoute requireAdmin={true}><AdminReviewPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

12. ✅ **Admin Disputes** (`/dashboard/admin/disputes`)
    - **File:** `src/pages/dashboard/admin/disputes.jsx`
    - **Route:** `<Route path="admin/disputes" element={<ProtectedRoute requireAdmin={true}><AdminDisputesPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

13. ✅ **Admin Support Tickets** (`/dashboard/admin/support-tickets`)
    - **File:** `src/pages/dashboard/admin/support-tickets.jsx`
    - **Route:** `<Route path="admin/support-tickets" element={<ProtectedRoute requireAdmin={true}><AdminSupportTicketsPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

14. ✅ **Admin Marketplace** (`/dashboard/admin/marketplace`)
    - **File:** `src/pages/dashboard/admin/marketplace.jsx`
    - **Route:** `<Route path="admin/marketplace" element={<ProtectedRoute requireAdmin={true}><AdminMarketplacePage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

15. ✅ **Admin Onboarding Tracker** (`/dashboard/admin/onboarding-tracker`)
    - **File:** `src/pages/dashboard/admin/onboarding-tracker.jsx`
    - **Route:** `<Route path="admin/onboarding-tracker" element={<ProtectedRoute requireAdmin={true}><AdminOnboardingTrackerPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

16. ✅ **Admin Revenue** (`/dashboard/admin/revenue`)
    - **File:** `src/pages/dashboard/admin/revenue.jsx`
    - **Route:** `<Route path="admin/revenue" element={<ProtectedRoute requireAdmin={true}><AdminRevenuePage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

17. ✅ **Admin RFQ Matching** (`/dashboard/admin/rfq-matching`)
    - **File:** `src/pages/dashboard/admin/rfq-matching.jsx`
    - **Route:** `<Route path="admin/rfq-matching" element={<ProtectedRoute requireAdmin={true}><AdminRFQMatchingPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

18. ✅ **Admin RFQ Analytics** (`/dashboard/admin/rfq-analytics`)
    - **File:** `src/pages/dashboard/admin/rfq-analytics.jsx`
    - **Route:** `<Route path="admin/rfq-analytics" element={<ProtectedRoute requireAdmin={true}><AdminRFQAnalyticsPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

19. ✅ **Admin Supplier Management** (`/dashboard/admin/supplier-management`)
    - **File:** `src/pages/dashboard/admin/supplier-management.jsx`
    - **Route:** `<Route path="admin/supplier-management" element={<ProtectedRoute requireAdmin={true}><AdminSupplierManagementPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

20. ✅ **Admin Growth Metrics** (`/dashboard/admin/growth-metrics`)
    - **File:** `src/pages/dashboard/admin/growth-metrics.jsx`
    - **Route:** `<Route path="admin/growth-metrics" element={<ProtectedRoute requireAdmin={true}><AdminGrowthMetricsPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

21. ✅ **Admin Trade Intelligence** (`/dashboard/admin/trade-intelligence`)
    - **File:** `src/pages/dashboard/admin/trade-intelligence.jsx`
    - **Route:** `<Route path="admin/trade-intelligence" element={<ProtectedRoute requireAdmin={true}><AdminTradeIntelligencePage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

22. ✅ **Admin KYB** (`/dashboard/admin/kyb`)
    - **File:** `src/pages/dashboard/admin/kyb.jsx`
    - **Route:** `<Route path="admin/kyb" element={<ProtectedRoute requireAdmin={true}><AdminKYBPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

23. ✅ **Admin Verification Review** (`/dashboard/admin/verification-review`)
    - **File:** `src/pages/dashboard/admin/verification-review.jsx`
    - **Route:** `<Route path="admin/verification-review" element={<ProtectedRoute requireAdmin={true}><AdminVerificationReviewPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

24. ✅ **Admin Reviews** (`/dashboard/admin/reviews`)
    - **File:** `src/pages/dashboard/admin/reviews.jsx`
    - **Route:** `<Route path="admin/reviews" element={<ProtectedRoute requireAdmin={true}><AdminReviewsPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

25. ✅ **Admin Reviews Moderation** (`/dashboard/admin/reviews-moderation`)
    - **File:** `src/pages/dashboard/admin/reviews-moderation.jsx`
    - **Route:** `<Route path="admin/reviews-moderation" element={<ProtectedRoute requireAdmin={true}><AdminReviewsModerationPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

26. ✅ **Admin Trust Engine** (`/dashboard/admin/trust-engine`)
    - **File:** `src/pages/dashboard/admin/trust-engine.jsx`
    - **Route:** `<Route path="admin/trust-engine" element={<ProtectedRoute requireAdmin={true}><AdminTrustEnginePage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

27. ✅ **Admin RFQ Review** (`/dashboard/admin/rfq-review`)
    - **File:** `src/pages/dashboard/admin/rfq-review.jsx`
    - **Route:** `<Route path="admin/rfq-review" element={<ProtectedRoute requireAdmin={true}><AdminRFQReviewPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

28. ✅ **Admin Leads** (`/dashboard/admin/leads`)
    - **File:** `src/pages/dashboard/admin/leads.jsx`
    - **Route:** `<Route path="admin/leads" element={<ProtectedRoute requireAdmin={true}><AdminLeadsPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

29. ✅ **Admin Founder Control Panel** (`/dashboard/admin/founder-control`)
    - **File:** `src/pages/dashboard/admin/founder-control-panel.jsx`
    - **Route:** `<Route path="admin/founder-control" element={<ProtectedRoute requireAdmin={true}><AdminFounderControlPage /></ProtectedRoute>} />`
    - **Status:** ✅ Connected

30. ✅ **Admin Default** (`/dashboard/admin`)
    - **Route:** `<Route path="admin" element={<Navigate to="/dashboard/admin/users" replace />} />`
    - **Status:** ✅ Connected (redirects to users)

#### Dynamic Routes (Detail Pages)
31. ✅ **Order Detail** (`/dashboard/orders/:id`)
    - **File:** `src/pages/dashboard/orders/[id].jsx`
    - **Route:** ❌ **NOT EXPLICITLY ROUTED** (may be handled by OrdersPage)
    - **Status:** ⚠️ **NEEDS VERIFICATION**

32. ✅ **RFQ Detail** (`/dashboard/rfqs/:id`)
    - **File:** `src/pages/dashboard/rfqs/[id].jsx`
    - **Route:** ❌ **NOT EXPLICITLY ROUTED** (may be handled by RFQsPage)
    - **Status:** ⚠️ **NEEDS VERIFICATION**

33. ✅ **Product Detail** (`/dashboard/products/:id`)
    - **File:** `src/pages/dashboard/products/new.jsx` (new product form)
    - **Route:** ❌ **NOT EXPLICITLY ROUTED**
    - **Status:** ⚠️ **NEEDS VERIFICATION**

34. ✅ **Shipment Detail** (`/dashboard/shipments/:id`)
    - **File:** `src/pages/dashboard/shipments/[id].jsx`
    - **Route:** ❌ **NOT EXPLICITLY ROUTED**
    - **Status:** ⚠️ **NEEDS VERIFICATION**

---

### ⚠️ UNROUTED PAGES (Exist but Not Connected)

#### Pages That Exist But Are NOT Routed:

1. ❌ **Shipments** (`/dashboard/shipments`)
   - **File:** `src/pages/dashboard/shipments.jsx`
   - **Status:** ❌ **NOT ROUTED**
   - **Issue:** Page exists but no route in App.jsx

2. ❌ **Supplier RFQs** (`/dashboard/supplier-rfqs`)
   - **File:** `src/pages/dashboard/supplier-rfqs.jsx`
   - **Status:** ❌ **NOT ROUTED**
   - **Issue:** Page exists but no route in App.jsx

3. ❌ **Team Members** (`/dashboard/team-members`)
   - **File:** `src/pages/dashboard/team-members.jsx`
   - **Status:** ❌ **NOT ROUTED**
   - **Issue:** Page exists but no route in App.jsx

4. ❌ **Notifications** (`/dashboard/notifications`)
   - **File:** `src/pages/dashboard/notifications.jsx`
   - **Status:** ❌ **NOT ROUTED**
   - **Issue:** Page exists but no route in App.jsx

5. ❌ **Analytics** (`/dashboard/analytics`)
   - **File:** `src/pages/dashboard/analytics.jsx`
   - **Status:** ❌ **NOT ROUTED**
   - **Issue:** Page exists but no route in App.jsx

6. ❌ **Returns** (`/dashboard/returns`)
   - **File:** `src/pages/dashboard/returns.jsx`
   - **Status:** ❌ **NOT ROUTED**

7. ❌ **Return Detail** (`/dashboard/returns/:id`)
   - **File:** `src/pages/dashboard/returns/[id].jsx`
   - **Status:** ❌ **NOT ROUTED**

8. ❌ **Invoices** (`/dashboard/invoices`)
   - **File:** `src/pages/dashboard/invoices.jsx`
   - **Status:** ❌ **NOT ROUTED**

9. ❌ **Invoice Detail** (`/dashboard/invoices/:id`)
   - **File:** `src/pages/dashboard/invoices/[id].jsx`
   - **Status:** ❌ **NOT ROUTED**

10. ❌ **Escrow** (`/dashboard/escrow/:orderId`)
    - **File:** `src/pages/dashboard/escrow/[orderId].jsx`
    - **Status:** ❌ **NOT ROUTED**

11. ❌ **Reviews** (`/dashboard/reviews`)
    - **File:** `src/pages/dashboard/reviews.jsx`
    - **Status:** ❌ **NOT ROUTED**

12. ❌ **Disputes** (`/dashboard/disputes`)
    - **File:** `src/pages/dashboard/disputes.jsx`
    - **Status:** ❌ **NOT ROUTED**

13. ❌ **Fulfillment** (`/dashboard/fulfillment`)
    - **File:** `src/pages/dashboard/fulfillment.jsx`
    - **Status:** ❌ **NOT ROUTED**

14. ❌ **Logistics Dashboard** (`/dashboard/logistics-dashboard`)
    - **File:** `src/pages/dashboard/logistics-dashboard.jsx`
    - **Status:** ❌ **NOT ROUTED**

15. ❌ **Logistics Quote** (`/dashboard/logistics-quote`)
    - **File:** `src/pages/dashboard/logistics-quote.jsx`
    - **Status:** ❌ **NOT ROUTED**

16. ❌ **Logistics Home** (`/dashboard/logistics`)
    - **File:** `src/pages/dashboard/logistics/LogisticsHome.jsx`
    - **Status:** ❌ **NOT ROUTED**

17. ❌ **Buyer Home** (`/dashboard/buyer`)
    - **File:** `src/pages/dashboard/buyer/BuyerHome.jsx`
    - **Status:** ❌ **NOT ROUTED** (legacy)

18. ❌ **Buyer Intelligence** (`/dashboard/buyer/intelligence`)
    - **File:** `src/pages/dashboard/buyer/intelligence.jsx`
    - **Status:** ❌ **NOT ROUTED**

19. ❌ **Seller Home** (`/dashboard/seller`)
    - **File:** `src/pages/dashboard/seller/SellerHome.jsx`
    - **Status:** ❌ **NOT ROUTED** (legacy)

20. ❌ **Seller Intelligence** (`/dashboard/seller/intelligence`)
    - **File:** `src/pages/dashboard/seller/intelligence.jsx`
    - **Status:** ❌ **NOT ROUTED**

21. ❌ **Hybrid Home** (`/dashboard/hybrid`)
    - **File:** `src/pages/dashboard/hybrid/HybridHome.jsx`
    - **Status:** ❌ **NOT ROUTED** (legacy)

22. ❌ **Verification Status** (`/dashboard/verification-status`)
    - **File:** `src/pages/dashboard/verification-status.jsx`
    - **Status:** ❌ **NOT ROUTED**

23. ❌ **Verification Marketplace** (`/dashboard/verification-marketplace`)
    - **File:** `src/pages/dashboard/verification-marketplace.jsx`
    - **Status:** ❌ **NOT ROUTED**

24. ❌ **KYC** (`/dashboard/kyc`)
    - **File:** `src/pages/dashboard/kyc.jsx`
    - **Status:** ❌ **NOT ROUTED**

25. ❌ **Company Info** (`/dashboard/company-info`)
    - **File:** `src/pages/dashboard/company-info.jsx`
    - **Status:** ❌ **NOT ROUTED**

26. ❌ **Subscriptions** (`/dashboard/subscriptions`)
    - **File:** `src/pages/dashboard/subscriptions.jsx`
    - **Status:** ❌ **NOT ROUTED**

27. ❌ **Supplier Analytics** (`/dashboard/supplier-analytics`)
    - **File:** `src/pages/dashboard/supplier-analytics.jsx`
    - **Status:** ❌ **NOT ROUTED**

28. ❌ **Performance** (`/dashboard/performance`)
    - **File:** `src/pages/dashboard/performance.jsx`
    - **Status:** ❌ **NOT ROUTED**

29. ❌ **Risk** (`/dashboard/risk`)
    - **File:** `src/pages/dashboard/risk.jsx`
    - **Status:** ❌ **NOT ROUTED**

30. ❌ **Compliance** (`/dashboard/compliance`)
    - **File:** `src/pages/dashboard/compliance.jsx`
    - **Status:** ❌ **NOT ROUTED**

31. ❌ **Protection** (`/dashboard/protection`)
    - **File:** `src/pages/dashboard/protection.jsx`
    - **Status:** ❌ **NOT ROUTED**

32. ❌ **Saved** (`/dashboard/saved`)
    - **File:** `src/pages/dashboard/saved.jsx`
    - **Status:** ❌ **NOT ROUTED**

33. ❌ **Support Chat** (`/dashboard/support-chat`)
    - **File:** `src/pages/dashboard/support-chat.jsx`
    - **Status:** ❌ **NOT ROUTED**

34. ❌ **Help** (`/dashboard/help`)
    - **File:** `src/pages/dashboard/help.jsx`
    - **Status:** ❌ **NOT ROUTED**

35. ❌ **Crisis** (`/dashboard/crisis`)
    - **File:** `src/pages/dashboard/crisis.jsx`
    - **Status:** ❌ **NOT ROUTED**

36. ❌ **Anticorruption** (`/dashboard/anticorruption`)
    - **File:** `src/pages/dashboard/anticorruption.jsx`
    - **Status:** ❌ **NOT ROUTED**

37. ❌ **Audit** (`/dashboard/audit`)
    - **File:** `src/pages/dashboard/audit.jsx`
    - **Status:** ❌ **NOT ROUTED**

38. ❌ **KoniAI** (`/dashboard/koniai`)
    - **File:** `src/pages/dashboard/koniai.jsx`
    - **Status:** ❌ **NOT ROUTED**

39. ❌ **Architecture Viewer** (`/dashboard/architecture-viewer`)
    - **File:** `src/pages/dashboard/architecture-viewer.jsx`
    - **Status:** ❌ **NOT ROUTED** (dev tool)

40. ❌ **Test Emails** (`/dashboard/test-emails`)
    - **File:** `src/pages/dashboard/test-emails.jsx`
    - **Status:** ❌ **NOT ROUTED** (dev tool)

---

## 🔐 Authentication Flow - Complete Analysis

### Step 1: App Initialization

```
main.jsx
  ↓
App.jsx
  ↓
Context Providers (in order):
  1. LanguageProvider
  2. CurrencyProvider
  3. AuthProvider ⭐ CRITICAL
  4. UserProvider (wraps AuthProvider)
  5. RoleProvider (uses AuthProvider)
  6. CapabilityProvider (only for dashboard routes)
```

### Step 2: AuthProvider Initialization

**File:** `src/contexts/AuthProvider.jsx`

**Flow:**
```
1. Component mounts
   ↓
2. resolveAuth() called
   ↓
3. Check session: supabase.auth.getSession()
   ↓
4. If session exists:
   ├─ Get user from session
   ├─ Query profiles table: profiles.select('*').eq('id', user.id)
   ├─ Set user, profile, role state
   └─ Set authReady = true
   ↓
5. If no session:
   ├─ Set user = null, profile = null, role = null
   └─ Set authReady = true (still ready, just guest mode)
   ↓
6. Subscribe to auth state changes:
   ├─ SIGNED_IN → silentRefresh()
   ├─ SIGNED_OUT → clear state
   ├─ TOKEN_REFRESHED → silentRefresh()
   └─ USER_UPDATED → silentRefresh()
```

**Key Properties:**
- `user`: Supabase auth user object (or null)
- `profile`: Profile from `profiles` table (or null)
- `role`: Profile role (deprecated, kept for compatibility)
- `authReady`: Boolean - true when auth state is known
- `loading`: Boolean - true only during initial load

**Critical Rules:**
- ✅ `authReady` NEVER goes back to false once true
- ✅ Loading only shows on INITIAL load, not refresh
- ✅ Silent refresh doesn't change loading state

---

### Step 3: Sign-In Process

**File:** `src/pages/login.jsx`

**Flow:**
```
1. User enters email/password
   ↓
2. handleLogin() called
   ↓
3. supabase.auth.signInWithPassword({ email, password })
   ↓
4. If success:
   ├─ Navigate to /auth/post-login
   ├─ Log login event (non-blocking)
   └─ AuthProvider detects SIGNED_IN event → silentRefresh()
   ↓
5. If error:
   ├─ Show error toast
   └─ Log failed login (non-blocking)
```

**OAuth Flow:**
```
1. User clicks Google/Facebook sign-in
   ↓
2. Redirects to OAuth provider
   ↓
3. Provider redirects to /auth/callback
   ↓
4. AuthCallback component:
   ├─ Extracts tokens from URL hash
   ├─ Gets session from Supabase
   ├─ Gets user from Supabase
   ├─ Creates profile if doesn't exist
   └─ Navigates to /auth/post-login
```

---

### Step 4: Post-Login Router

**File:** `src/auth/PostLoginRouter.jsx`

**Flow:**
```
1. Component mounts
   ↓
2. Wait for authReady
   ↓
3. If no user:
   └─ Navigate to /login
   ↓
4. If user but no profile:
   ├─ Create profile in profiles table
   └─ Navigate to /onboarding/company
   ↓
5. If profile but no company_id:
   └─ Navigate to /onboarding/company
   ↓
6. If profile has company_id:
   └─ Navigate to /dashboard
```

**Key Logic:**
- ✅ Checks `profile.company_id` (not role)
- ✅ Redirects to onboarding if company missing
- ✅ Redirects to dashboard if company exists

---

### Step 5: Dashboard Entry

**Route:** `/dashboard/*`

**Flow:**
```
1. User navigates to /dashboard/*
   ↓
2. App.jsx Route matches:
   <Route path="/dashboard/*" element={
     <CapabilityProvider>
       <RequireCapability require={null}>
         <Dashboard />
       </RequireCapability>
     </CapabilityProvider>
   }>
   ↓
3. CapabilityProvider mounts:
   ├─ Uses useAuth() to get user, profile
   ├─ Extracts company_id from profile
   ├─ Queries company_capabilities table
   ├─ Sets capabilities state
   └─ Sets ready = true (allows rendering)
   ↓
4. RequireCapability checks:
   ├─ If capabilities.ready === false → Show spinner
   ├─ If database sync error → Show error message
   └─ If capabilities.ready === true → Render Dashboard
   ↓
5. Dashboard component renders:
   └─ Returns <WorkspaceDashboard />
   ↓
6. WorkspaceDashboard:
   ├─ Uses useCapability() hook
   ├─ Checks capabilities.ready
   ├─ Renders DashboardLayout
   └─ Renders <Outlet /> for child routes
   ↓
7. DashboardLayout:
   ├─ Reads capabilities from context
   ├─ Builds sidebar menu dynamically
   ├─ Renders header (based on capabilities)
   └─ Renders <Outlet /> for page content
   ↓
8. Child route renders (e.g., DashboardHome)
   └─ Uses useCapability() hook for data loading
```

---

## 🎯 Capability System - Complete Flow

### CapabilityProvider Initialization

**File:** `src/context/CapabilityContext.tsx`

**Flow:**
```
1. Component mounts
   ↓
2. Initial state:
   {
     can_buy: true,
     can_sell: false,
     can_logistics: false,
     sell_status: 'disabled',
     logistics_status: 'disabled',
     company_id: null,
     loading: false,
     ready: true, ⭐ CRITICAL: Starts true
     error: null
   }
   ↓
3. useEffect triggers when:
   ├─ authReady changes to true
   ├─ user.id changes
   └─ profile.company_id changes
   ↓
4. fetchCapabilities() called:
   ├─ Check prerequisites (authReady, user, company_id)
   ├─ If missing → Set ready=true, return (allow rendering)
   ├─ Query: company_capabilities.select('*').eq('company_id', company_id).single()
   ├─ If error PGRST116 (not found):
   │   └─ Create row with defaults
   ├─ If success:
   │   └─ Set capabilities state, ready=true
   └─ If error:
       ├─ If table missing → Set ready=true, error message
       └─ If network error → Set ready=true, allow access
   ↓
5. Timeout fallback (10 seconds):
   └─ If still loading → Force ready=true
```

**Key Properties:**
- `can_buy`: Boolean - Can user buy? (default: true)
- `can_sell`: Boolean - Can user sell? (default: false)
- `can_logistics`: Boolean - Can user do logistics? (default: false)
- `sell_status`: 'disabled' | 'pending' | 'approved'
- `logistics_status`: 'disabled' | 'pending' | 'approved'
- `company_id`: UUID - Company ID
- `loading`: Boolean - Loading state
- `ready`: Boolean - ⭐ CRITICAL: Must be true to render
- `error`: String | null - Error message

**Critical Rules:**
- ✅ `ready` ALWAYS starts as true (allows rendering)
- ✅ `ready` NEVER blocks rendering (even on errors)
- ✅ Safe defaults if table missing
- ✅ Timeout fallback prevents infinite loading

---

### useCapability Hook

**File:** `src/context/CapabilityContext.tsx`

**Flow:**
```
1. Component calls useCapability()
   ↓
2. useContext(CapabilityContext)
   ↓
3. If context exists:
   └─ Return context value
   ↓
4. If context missing:
   └─ Return safe defaults (ready: true)
```

**Safe Defaults:**
```javascript
{
  can_buy: true,
  can_sell: false,
  can_logistics: false,
  sell_status: 'disabled',
  logistics_status: 'disabled',
  company_id: null,
  loading: false,
  ready: true, // ✅ Always ready
  error: null,
  refreshCapabilities: async () => {}
}
```

---

## 🔄 Data Flow - Complete Analysis

### Frontend Data Flow

```
User Action (Login/Navigate)
  ↓
AuthProvider
  ├─ Queries: auth.users (via Supabase Auth)
  └─ Queries: profiles table (company_id, role, etc.)
  ↓
CapabilityProvider (Dashboard only)
  ├─ Reads: profile.company_id
  └─ Queries: company_capabilities table
  ↓
DashboardLayout
  ├─ Reads: capabilities from context
  ├─ Builds: Sidebar menu dynamically
  └─ Renders: Header based on capabilities
  ↓
Page Components (DashboardHome, OrdersPage, etc.)
  ├─ Read: capabilities from context
  ├─ Read: user, profile from AuthProvider
  ├─ Read: company_id from profile
  └─ Query: Data tables (orders, rfqs, products, etc.)
  ↓
Supabase Database
  ├─ RLS Policies enforce access
  └─ Returns filtered data
```

---

### Backend Data Flow

#### Database Tables Used:

1. **auth.users** (Supabase Auth)
   - Managed by Supabase Auth
   - Contains: id, email, user_metadata, etc.

2. **profiles**
   - **Columns:** id, full_name, email, company_id, role (deprecated), onboarding_completed
   - **RLS:** Users can only see their own profile
   - **Queried by:** AuthProvider, PostLoginRouter

3. **companies**
   - **Columns:** id, company_name, owner_email, country, city, verified, etc.
   - **RLS:** Company-scoped access
   - **Queried by:** UserContext, DashboardHome, various pages

4. **company_capabilities** ⭐ CRITICAL
   - **Columns:** company_id, can_buy, can_sell, can_logistics, sell_status, logistics_status
   - **RLS:** Users can only see their company's capabilities
   - **Queried by:** CapabilityProvider
   - **Auto-created:** Via trigger when company is created

5. **orders**
   - **Columns:** id, buyer_company_id, seller_company_id, status, total_amount, etc.
   - **RLS:** Users can only see orders they're involved in
   - **Queried by:** OrdersPage, OrderDetailPage

6. **rfqs**
   - **Columns:** id, buyer_company_id, category_id, status, etc.
   - **RLS:** Buyers see their RFQs, sellers see open RFQs
   - **Queried by:** RFQsPage, RFQDetailPage

7. **products**
   - **Columns:** id, company_id, name, description, status, etc.
   - **RLS:** Public can view, authenticated can create/update own
   - **Queried by:** ProductsPage, ProductDetailPage

8. **notifications**
   - **Columns:** id, user_id, company_id, user_email, title, message, read, etc.
   - **RLS:** Users can only see their notifications
   - **Queried by:** NotificationBell, NotificationsPage

9. **kyc_verifications**
   - **Columns:** id, company_id, user_id, status, documents, etc.
   - **RLS:** Users can only see their own KYC
   - **Queried by:** VerificationCenter, useNotificationCounts

10. **messages**
    - **Columns:** id, conversation_id, sender_id, content, read, etc.
    - **RLS:** Users can only see messages in their conversations
    - **Queried by:** MessagesPage, NotificationBell

---

### RLS (Row Level Security) Flow

**How RLS Works:**
```
1. User makes query to Supabase
   ↓
2. Supabase checks RLS policies
   ↓
3. Policy checks:
   ├─ auth.uid() - Current user ID
   ├─ profile.company_id - User's company
   └─ Other conditions (status, etc.)
   ↓
4. If policy allows:
   └─ Return filtered rows
   ↓
5. If policy denies:
   └─ Return empty array or error
```

**Example: Orders RLS**
```sql
CREATE POLICY "orders_select_involved"
ON orders FOR SELECT
USING (
  buyer_company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
  OR
  seller_company_id IN (
    SELECT company_id FROM profiles WHERE id = auth.uid()
  )
);
```

**Result:** Users only see orders where they're buyer OR seller.

---

## 🔗 Component Connections

### Dashboard Component Hierarchy

```
App.jsx
  └─ Routes
      └─ Route /dashboard/*
          └─ CapabilityProvider
              └─ RequireCapability (route guard)
                  └─ Dashboard
                      └─ WorkspaceDashboard
                          ├─ DashboardRealtimeManager (realtime subscriptions)
                          └─ DashboardLayout
                              ├─ Sidebar (built from capabilities)
                              ├─ Header (selected by capabilities)
                              └─ <Outlet />
                                  └─ Page Component (DashboardHome, OrdersPage, etc.)
```

### Context Providers Hierarchy

```
App
  └─ LanguageProvider
      └─ CurrencyProvider
          └─ AuthProvider ⭐
              └─ UserProvider (wraps AuthProvider)
                  └─ RoleProvider (uses AuthProvider)
                      └─ Routes
                          └─ /dashboard/*
                              └─ CapabilityProvider (only for dashboard)
                                  └─ RequireCapability
                                      └─ Dashboard
```

**Key Points:**
- ✅ AuthProvider wraps entire app
- ✅ CapabilityProvider only wraps dashboard routes
- ✅ All dashboard pages can access both contexts

---

## 📊 Route-to-Page Mapping

### ✅ Connected Routes (26 routes)

| Route | Component | File | Status |
|-------|-----------|------|--------|
| `/dashboard` | DashboardHome | `dashboard/DashboardHome.jsx` | ✅ Connected |
| `/dashboard/orders` | OrdersPage | `dashboard/orders.jsx` | ✅ Connected |
| `/dashboard/rfqs` | RFQsPage | `dashboard/rfqs.jsx` | ✅ Connected |
| `/dashboard/rfqs/new` | RFQsNewPage | `dashboard/rfqs/new.jsx` | ✅ Connected |
| `/dashboard/products` | ProductsPage | `dashboard/products.jsx` | ✅ Connected |
| `/dashboard/sales` | SalesPage | `dashboard/sales.jsx` | ✅ Connected |
| `/dashboard/payments` | PaymentsPage | `dashboard/payments.jsx` | ✅ Connected |
| `/dashboard/settings` | SettingsPage | `dashboard/settings.jsx` | ✅ Connected |
| `/dashboard/admin/users` | AdminUsersPage | `dashboard/admin/users.jsx` | ✅ Connected |
| `/dashboard/admin/analytics` | AdminAnalyticsPage | `dashboard/admin/analytics.jsx` | ✅ Connected |
| `/dashboard/admin/review` | AdminReviewPage | `dashboard/admin/review.jsx` | ✅ Connected |
| `/dashboard/admin/disputes` | AdminDisputesPage | `dashboard/admin/disputes.jsx` | ✅ Connected |
| `/dashboard/admin/support-tickets` | AdminSupportTicketsPage | `dashboard/admin/support-tickets.jsx` | ✅ Connected |
| `/dashboard/admin/marketplace` | AdminMarketplacePage | `dashboard/admin/marketplace.jsx` | ✅ Connected |
| `/dashboard/admin/onboarding-tracker` | AdminOnboardingTrackerPage | `dashboard/admin/onboarding-tracker.jsx` | ✅ Connected |
| `/dashboard/admin/revenue` | AdminRevenuePage | `dashboard/admin/revenue.jsx` | ✅ Connected |
| `/dashboard/admin/rfq-matching` | AdminRFQMatchingPage | `dashboard/admin/rfq-matching.jsx` | ✅ Connected |
| `/dashboard/admin/rfq-analytics` | AdminRFQAnalyticsPage | `dashboard/admin/rfq-analytics.jsx` | ✅ Connected |
| `/dashboard/admin/supplier-management` | AdminSupplierManagementPage | `dashboard/admin/supplier-management.jsx` | ✅ Connected |
| `/dashboard/admin/growth-metrics` | AdminGrowthMetricsPage | `dashboard/admin/growth-metrics.jsx` | ✅ Connected |
| `/dashboard/admin/trade-intelligence` | AdminTradeIntelligencePage | `dashboard/admin/trade-intelligence.jsx` | ✅ Connected |
| `/dashboard/admin/kyb` | AdminKYBPage | `dashboard/admin/kyb.jsx` | ✅ Connected |
| `/dashboard/admin/verification-review` | AdminVerificationReviewPage | `dashboard/admin/verification-review.jsx` | ✅ Connected |
| `/dashboard/admin/reviews` | AdminReviewsPage | `dashboard/admin/reviews.jsx` | ✅ Connected |
| `/dashboard/admin/reviews-moderation` | AdminReviewsModerationPage | `dashboard/admin/reviews-moderation.jsx` | ✅ Connected |
| `/dashboard/admin/trust-engine` | AdminTrustEnginePage | `dashboard/admin/trust-engine.jsx` | ✅ Connected |
| `/dashboard/admin/rfq-review` | AdminRFQReviewPage | `dashboard/admin/rfq-review.jsx` | ✅ Connected |
| `/dashboard/admin/leads` | AdminLeadsPage | `dashboard/admin/leads.jsx` | ✅ Connected |
| `/dashboard/admin/founder-control` | AdminFounderControlPage | `dashboard/admin/founder-control-panel.jsx` | ✅ Connected |
| `/dashboard/admin` | Navigate | Redirects to `/dashboard/admin/users` | ✅ Connected |

### ❌ Unconnected Pages (40+ pages)

| Page | File | Status | Issue |
|------|------|--------|-------|
| Shipments | `dashboard/shipments.jsx` | ❌ Not Routed | Missing route |
| Supplier RFQs | `dashboard/supplier-rfqs.jsx` | ❌ Not Routed | Missing route |
| Team Members | `dashboard/team-members.jsx` | ❌ Not Routed | Missing route |
| Notifications | `dashboard/notifications.jsx` | ❌ Not Routed | Missing route |
| Analytics | `dashboard/analytics.jsx` | ❌ Not Routed | Missing route |
| Returns | `dashboard/returns.jsx` | ❌ Not Routed | Missing route |
| Invoices | `dashboard/invoices.jsx` | ❌ Not Routed | Missing route |
| Reviews | `dashboard/reviews.jsx` | ❌ Not Routed | Missing route |
| Disputes | `dashboard/disputes.jsx` | ❌ Not Routed | Missing route |
| ... (30+ more) | ... | ❌ Not Routed | Missing routes |

---

## 🔄 Authentication State Machine

### State Transitions

```
INITIAL STATE
  ├─ authReady: false
  ├─ loading: true
  ├─ user: null
  └─ profile: null
  ↓
AUTH CHECKING
  ├─ authReady: false
  ├─ loading: true
  └─ Querying: supabase.auth.getSession()
  ↓
GUEST MODE (no session)
  ├─ authReady: true ✅
  ├─ loading: false
  ├─ user: null
  └─ profile: null
  ↓
LOGGED IN (session exists)
  ├─ authReady: true ✅
  ├─ loading: false
  ├─ user: { id, email, ... }
  └─ profile: { id, company_id, ... }
  ↓
CAPABILITIES LOADING (dashboard only)
  ├─ capabilities.ready: true (starts true)
  ├─ capabilities.loading: true
  └─ Querying: company_capabilities table
  ↓
CAPABILITIES READY
  ├─ capabilities.ready: true ✅
  ├─ capabilities.loading: false
  └─ capabilities: { can_buy, can_sell, ... }
```

**Critical Rules:**
- ✅ `authReady` goes false → true ONCE, never back
- ✅ `capabilities.ready` starts true, stays true
- ✅ Loading states are temporary
- ✅ Errors don't block rendering

---

## 🎯 Capability-Based Access Control

### How Capabilities Control Access

#### 1. Route Level (RequireCapability)
```javascript
// App.jsx
<Route path="/dashboard/products" element={
  <RequireCapability require="sell" requireApproved>
    <ProductsPage />
  </RequireCapability>
} />
```

**Flow:**
```
1. User navigates to /dashboard/products
   ↓
2. RequireCapability checks:
   ├─ capabilities.ready === true? → Continue
   ├─ capabilities.can_sell === true? → Continue
   └─ capabilities.sell_status === 'approved'? → Render page
   ↓
3. If any check fails:
   └─ Navigate to /dashboard
```

#### 2. Component Level (RequireCapability Guard)
```javascript
// ProductsPage.jsx
<RequireCapability canSell requireApproved>
  <ProductForm />
</RequireCapability>
```

**Flow:**
```
1. Component renders
   ↓
2. RequireCapability checks capabilities
   ↓
3. If missing:
   └─ Show AccessDenied component
   ↓
4. If present:
   └─ Render children
```

#### 3. UI Level (DashboardLayout)
```javascript
// DashboardLayout.jsx
{capabilities.can_sell && capabilities.sell_status === 'approved' && (
  <SidebarItem to="/dashboard/products">Products</SidebarItem>
)}
```

**Flow:**
```
1. DashboardLayout reads capabilities
   ↓
2. Builds sidebar menu dynamically
   ↓
3. Only shows items user can access
   ↓
4. Hides locked items
```

---

## 📡 Backend Data Connections

### Supabase Client Configuration

**File:** `src/api/supabaseClient.js`

**Connection:**
- **URL:** `VITE_SUPABASE_URL` (from .env)
- **Key:** `VITE_SUPABASE_ANON_KEY` (from .env)
- **RLS:** Enabled on all tables
- **Realtime:** Enabled for subscriptions

### Database Queries Flow

```
Frontend Component
  ↓
supabase.from('table_name')
  ↓
Supabase Client
  ├─ Adds auth header (JWT token)
  ├─ Adds RLS context (auth.uid())
  └─ Sends to Supabase API
  ↓
Supabase API
  ├─ Validates JWT token
  ├─ Extracts user ID
  ├─ Applies RLS policies
  └─ Returns filtered data
  ↓
Frontend Component
  └─ Receives data (or error)
```

### Realtime Subscriptions

**File:** `src/components/dashboard/DashboardRealtimeManager.jsx`

**Flow:**
```
1. WorkspaceDashboard mounts
   ↓
2. DashboardRealtimeManager mounts
   ↓
3. Creates Supabase channel:
   supabase.channel('dashboard-updates')
   ↓
4. Subscribes to tables:
   ├─ .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' })
   ├─ .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' })
   ├─ .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'rfqs' })
   └─ ... (other tables)
   ↓
5. On change:
   ├─ Calls handleRealtimeUpdate callback
   └─ Child components refresh data
```

**Key Points:**
- ✅ Single channel for all subscriptions
- ✅ Survives route changes (in WorkspaceDashboard)
- ✅ Only active when companyId exists

---

## 🔍 What Changed: Before vs After Migration

### Before Migration (Role-Based)

```
User Login
  ↓
AuthProvider loads profile
  ↓
profile.role extracted ('buyer', 'seller', 'hybrid', 'logistics')
  ↓
roleHelpers.js functions:
  ├─ getUserRole(profile) → 'buyer'
  ├─ isSeller(role) → false
  ├─ isHybrid(role) → false
  └─ canViewSellerFeatures(role) → false
  ↓
DashboardLayout:
  ├─ Reads role from context
  └─ Shows/hides menu items based on role
  ↓
Page Components:
  ├─ Check role for access
  └─ Load data based on role
```

**Problems:**
- ❌ Multiple role sources (profile.role, user_roles table, roleHelpers)
- ❌ No approval workflow
- ❌ Inconsistent behavior
- ❌ Hard to maintain

---

### After Migration (Capability-Based)

```
User Login
  ↓
AuthProvider loads profile
  ↓
CapabilityProvider (dashboard only):
  ├─ Reads profile.company_id
  └─ Queries company_capabilities table
  ↓
Capabilities loaded:
  ├─ can_buy: true
  ├─ can_sell: false → true (when enabled)
  ├─ sell_status: 'disabled' → 'pending' → 'approved'
  └─ logistics_status: 'disabled' → 'pending' → 'approved'
  ↓
DashboardLayout:
  ├─ Reads capabilities from context
  └─ Shows/hides menu items based on capabilities
  ↓
Page Components:
  ├─ Check capabilities for access
  └─ Load data based on capabilities
```

**Benefits:**
- ✅ Single source of truth (company_capabilities table)
- ✅ Approval workflow built-in
- ✅ Consistent behavior
- ✅ Easy to maintain

---

## 🚨 Critical Issues Found

### Issue 1: Missing Routes (40+ pages)

**Problem:** Many dashboard pages exist but are not routed in App.jsx

**Impact:**
- Users cannot navigate to these pages
- Links to these pages will 404
- Features are inaccessible

**Examples:**
- `/dashboard/shipments` - Page exists, no route
- `/dashboard/notifications` - Page exists, no route
- `/dashboard/analytics` - Page exists, no route
- `/dashboard/team-members` - Page exists, no route

**Fix Required:**
Add routes to App.jsx:
```javascript
<Route path="shipments" element={<ShipmentsPage />} />
<Route path="notifications" element={<NotificationsPage />} />
<Route path="analytics" element={<AnalyticsPage />} />
<Route path="team-members" element={<TeamMembersPage />} />
// ... etc
```

---

### Issue 2: Dynamic Routes Not Explicitly Routed

**Problem:** Detail pages use dynamic routes but may not be explicitly routed

**Examples:**
- `/dashboard/orders/:id` - May be handled by OrdersPage internally
- `/dashboard/rfqs/:id` - May be handled by RFQsPage internally
- `/dashboard/shipments/:id` - Not routed

**Fix Required:**
Add explicit routes:
```javascript
<Route path="orders/:id" element={<OrderDetailPage />} />
<Route path="rfqs/:id" element={<RFQDetailPage />} />
<Route path="shipments/:id" element={<ShipmentDetailPage />} />
```

---

### Issue 3: Legacy Role-Based Pages Still Exist

**Problem:** Legacy role-based pages exist but are not routed

**Examples:**
- `dashboard/buyer/BuyerHome.jsx` - Not routed
- `dashboard/seller/SellerHome.jsx` - Not routed
- `dashboard/hybrid/HybridHome.jsx` - Not routed
- `dashboard/logistics/LogisticsHome.jsx` - Not routed

**Status:** ✅ **INTENTIONAL** - These are legacy pages, replaced by capability-based DashboardHome

---

## 📋 Complete Route-to-Page Mapping

### ✅ Connected (26 routes)

**Core Dashboard (8 routes):**
1. `/dashboard` → DashboardHome
2. `/dashboard/orders` → OrdersPage
3. `/dashboard/rfqs` → RFQsPage
4. `/dashboard/rfqs/new` → RFQsNewPage
5. `/dashboard/products` → ProductsPage
6. `/dashboard/sales` → SalesPage
7. `/dashboard/payments` → PaymentsPage
8. `/dashboard/settings` → SettingsPage

**Admin Dashboard (18 routes):**
9-26. `/dashboard/admin/*` → Various admin pages

---

### ❌ Not Connected (40+ pages)

**Critical Missing Routes:**
- `/dashboard/shipments` → ShipmentsPage
- `/dashboard/notifications` → NotificationsPage
- `/dashboard/analytics` → AnalyticsPage
- `/dashboard/team-members` → TeamMembersPage
- `/dashboard/supplier-rfqs` → SupplierRFQsPage
- `/dashboard/returns` → ReturnsPage
- `/dashboard/invoices` → InvoicesPage
- `/dashboard/reviews` → ReviewsPage
- `/dashboard/disputes` → DisputesPage
- `/dashboard/fulfillment` → FulfillmentPage
- `/dashboard/logistics-dashboard` → LogisticsDashboardPage
- `/dashboard/logistics-quote` → LogisticsQuotePage
- `/dashboard/verification-status` → VerificationStatusPage
- `/dashboard/kyc` → KYCPage
- `/dashboard/company-info` → CompanyInfoPage
- `/dashboard/subscriptions` → SubscriptionsPage
- ... (25+ more)

---

## 🔐 Authentication & Authorization Summary

### Authentication Layers

1. **Supabase Auth** (Backend)
   - Manages user sessions
   - Provides JWT tokens
   - Handles OAuth

2. **AuthProvider** (Frontend)
   - Manages auth state
   - Provides user, profile, authReady
   - Handles session refresh

3. **ProtectedRoute** (Route Guard)
   - Checks authentication
   - Redirects to login if needed
   - Checks admin access

4. **RequireCapability** (Route Guard)
   - Checks capabilities.ready
   - Blocks route if not ready
   - Shows error if database sync issue

5. **RLS Policies** (Database)
   - Enforces row-level access
   - Filters data automatically
   - Final security layer

---

### Authorization Flow

```
User Action
  ↓
ProtectedRoute (if route protected)
  ├─ Check: user exists?
  ├─ Check: admin? (if requireAdmin)
  └─ Check: company_id? (if requireCompanyId)
  ↓
RequireCapability (dashboard routes)
  ├─ Check: capabilities.ready?
  ├─ Check: require capability? (if require prop)
  └─ Check: requireApproved? (if requireApproved)
  ↓
Page Component
  ├─ Read: capabilities from context
  ├─ Check: specific capability needed?
  └─ Load: data based on capabilities
  ↓
Database Query
  ├─ RLS applies filters
  └─ Returns: filtered data
```

---

## 📊 Data Loading Patterns

### Pattern 1: Capability-Based Data Loading

```javascript
// DashboardHome.jsx
const capabilities = useCapability();
const isBuyer = capabilities.can_buy === true;
const isSeller = capabilities.can_sell === true && capabilities.sell_status === 'approved';

// Load buyer data only if can_buy
if (isBuyer) {
  // Query orders, rfqs, etc.
}

// Load seller data only if can_sell AND approved
if (isSeller) {
  // Query products, sales, etc.
}
```

### Pattern 2: Company-Scoped Queries

```javascript
// All queries filter by company_id
const companyId = profile?.company_id;

const { data: orders } = await supabase
  .from('orders')
  .select('*')
  .or(`buyer_company_id.eq.${companyId},seller_company_id.eq.${companyId}`);
```

### Pattern 3: RLS-Enforced Queries

```javascript
// RLS automatically filters by company_id
// No need to manually filter
const { data: products } = await supabase
  .from('products')
  .select('*');
// RLS ensures user only sees their company's products
```

---

## 🎯 Summary: What Changed

### Authentication Changes

**Before:**
- Role-based routing
- Multiple role sources
- No approval workflow

**After:**
- Capability-based routing
- Single source of truth
- Approval workflow built-in

### Data Flow Changes

**Before:**
- Components checked role from profile
- Inconsistent role checks
- No database-driven access

**After:**
- Components check capabilities from database
- Consistent capability checks
- Database-driven access

### Route Changes

**Before:**
- Role-based routes (`/dashboard/buyer`, `/dashboard/seller`)
- Multiple dashboard entry points

**After:**
- Single dashboard entry (`/dashboard`)
- Capability-based navigation
- Dynamic sidebar based on capabilities

---

## ✅ Verification Checklist

### Routes
- [x] Core dashboard routes connected (8 routes)
- [x] Admin routes connected (18 routes)
- [ ] Missing routes identified (40+ pages)
- [ ] Dynamic routes verified

### Authentication
- [x] AuthProvider wraps entire app
- [x] CapabilityProvider wraps dashboard only
- [x] ProtectedRoute checks authentication
- [x] RequireCapability checks capabilities

### Data Flow
- [x] AuthProvider queries profiles table
- [x] CapabilityProvider queries company_capabilities table
- [x] Page components query data tables
- [x] RLS policies enforce access

### Capabilities
- [x] CapabilityContext starts with ready=true
- [x] useCapability returns safe defaults
- [x] All components use capabilities
- [x] No roleHelpers in dashboard pages

---

## 🚀 Recommendations

### Immediate Actions

1. **Add Missing Routes**
   - Add routes for all existing dashboard pages
   - Verify dynamic routes work
   - Test navigation

2. **Verify Dynamic Routes**
   - Check if detail pages are handled internally
   - Add explicit routes if needed
   - Test navigation to detail pages

3. **Clean Up Legacy Pages**
   - Remove or archive legacy role-based pages
   - Update documentation
   - Remove unused imports

### Long-term Improvements

4. **Consolidate Pages**
   - Merge similar pages
   - Remove duplicate functionality
   - Simplify navigation

5. **Add Route Guards**
   - Add RequireCapability to all pages
   - Add capability checks to data loading
   - Improve error handling

---

**Status:** ✅ **ANALYSIS COMPLETE**

This document provides a complete forensic analysis of the dashboard system, including all routes, pages, authentication flow, capability system, and data flow.
