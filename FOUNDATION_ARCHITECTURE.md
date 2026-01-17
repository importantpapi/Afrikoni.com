# Afrikoni Dashboard Foundation Architecture

## 🏗️ The Solid Foundation - How Everything Connects

This document visualizes how all pieces of the dashboard system connect to form a strong, scalable foundation.

---

## 🔗 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    USER AUTHENTICATION                           │
│                    (Supabase Auth)                               │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      USER PROFILE                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ profiles table                                           │   │
│  │ - id (UUID → auth.users.id)                              │   │
│  │ - company_id (UUID → companies.id)                       │   │
│  │ - full_name, email, etc.                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      COMPANY                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ companies table                                          │   │
│  │ - id (UUID PRIMARY KEY)                                  │   │
│  │ - company_name, country, etc.                            │   │
│  │                                                           │   │
│  │ 🔄 AUTO-TRIGGER: Creates capabilities row               │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ company_capabilities table ⭐ FOUNDATION                  │   │
│  │ - company_id (PRIMARY KEY → companies.id)                 │   │
│  │ - can_buy (BOOLEAN, default: true)                       │   │
│  │ - can_sell (BOOLEAN, default: false)                      │   │
│  │ - can_logistics (BOOLEAN, default: false)                │   │
│  │ - sell_status ('disabled'|'pending'|'approved')          │   │
│  │ - logistics_status ('disabled'|'pending'|'approved')     │   │
│  │                                                           │   │
│  │ ✅ SINGLE SOURCE OF TRUTH                                │   │
│  │ ✅ Auto-created via trigger                              │   │
│  │ ✅ Idempotent (never missing)                            │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                  CAPABILITY CONTEXT                              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ CapabilityContext.tsx                                    │   │
│  │                                                           │   │
│  │ 1. Fetches from company_capabilities                     │   │
│  │ 2. Provides to all components                            │   │
│  │ 3. Handles errors gracefully                             │   │
│  │                                                           │   │
│  │ ✅ Fail-safe error handling                              │   │
│  │ ✅ Loading states                                        │   │
│  │ ✅ Auto-retry on failure                                 │   │
│  └──────────────────────────────────────────────────────────┘   │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    ROUTE GUARDS                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ RequireCapability (Route Guard)                          │   │
│  │ - Waits for capability.ready                             │   │
│  │ - Blocks route if not ready                              │   │
│  │ - Shows spinner with timeout                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ DashboardLayout                                           │   │
│  │ - Reads capabilities from context                         │   │
│  │ - Builds sidebar dynamically                             │   │
│  │ - Shows/hides features based on capabilities             │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                     │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ Page Components                                           │   │
│  │ - RequireCapability (Component Guard)                     │   │
│  │ - Checks specific capabilities                           │   │
│  │ - Shows AccessDenied if missing                          │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: User Login → Dashboard Access

### Step 1: Authentication
```
User logs in
  ↓
Supabase Auth validates credentials
  ↓
auth.users record created/updated
```

### Step 2: Profile Loading
```
AuthProvider loads user profile
  ↓
profiles table queried (id = auth.uid())
  ↓
profile.company_id extracted
```

### Step 3: Company Loading
```
UserContext loads company
  ↓
companies table queried (id = profile.company_id)
  ↓
Company data available
```

### Step 4: Capabilities Loading ⭐ CRITICAL
```
CapabilityProvider fetches capabilities
  ↓
company_capabilities table queried (company_id = profile.company_id)
  ↓
  ├─ ✅ SUCCESS: Capabilities loaded
  │     ↓
  │   capabilities.ready = true
  │     ↓
  │   Dashboard renders
  │
  └─ ❌ ERROR: Table missing or query fails
        ↓
      capabilities.error = "Database sync error"
        ↓
      Show user-friendly error message
        ↓
      Dashboard blocked (fail-safe)
```

### Step 5: Route Guard
```
RequireCapability checks capabilities.ready
  ↓
  ├─ ready = true → Render dashboard
  └─ ready = false → Show spinner (with timeout)
```

### Step 6: Layout Rendering
```
DashboardLayout reads capabilities
  ↓
Builds sidebar menu dynamically
  ├─ can_buy = true → Show buyer features
  ├─ can_sell = true → Show seller features (if approved)
  └─ can_logistics = true → Show logistics features (if approved)
```

### Step 7: Page Access
```
Page component checks specific capability
  ↓
  ├─ Has capability → Render page
  └─ Missing capability → Show AccessDenied
```

---

## 🛡️ Security Layers (Defense in Depth)

### Layer 1: Database Level (RLS)
```
Row Level Security Policies
  ├─ company_capabilities: Users can only see their company's capabilities
  ├─ notifications: Users can only see their notifications
  ├─ products: Public can view, authenticated can create
  └─ orders: Users can only see orders they're involved in
```

### Layer 2: Route Level (Frontend)
```
RequireCapability Route Guard
  ├─ Blocks route if capabilities not ready
  ├─ Redirects if capability missing
  └─ Shows spinner during load
```

### Layer 3: Component Level (Frontend)
```
RequireCapability Component Guard
  ├─ Checks specific capabilities
  ├─ Shows AccessDenied if missing
  └─ Allows graceful degradation
```

### Layer 4: UI Level (Frontend)
```
DashboardLayout
  ├─ Hides menu items user can't access
  ├─ Shows locked items with reason
  └─ Prevents navigation to unauthorized pages
```

---

## 🔧 Auto-Creation Triggers (Idempotency)

### Company → Capabilities Trigger
```
User creates company
  ↓
INSERT INTO companies (...)
  ↓
TRIGGER: on_company_created fires
  ↓
INSERT INTO company_capabilities (company_id)
VALUES (NEW.id)
  ↓
✅ Every company ALWAYS has capabilities row
```

**Why This Matters:**
- **Idempotency**: No company can exist without capabilities
- **Consistency**: All companies start with same defaults
- **No Manual Steps**: Automatic, no human error

---

## 📊 Capability States & Transitions

### Buy Capability
```
can_buy = true (default for all companies)
  ↓
Always available (no approval needed)
  ↓
Shows: RFQs, Orders, Payments, Saved Products
```

### Sell Capability
```
can_sell = false (default)
  ↓
User enables selling → can_sell = true, sell_status = 'pending'
  ↓
Admin approves → sell_status = 'approved'
  ↓
Shows: Products, Sales, RFQs Received (only if approved)
```

### Logistics Capability
```
can_logistics = false (default)
  ↓
User enables logistics → can_logistics = true, logistics_status = 'pending'
  ↓
Admin approves → logistics_status = 'approved'
  ↓
Shows: Shipments, Fulfillment (only if approved)
```

---

## 🚨 Error Handling Flow

### Scenario 1: Table Missing
```
CapabilityContext queries company_capabilities
  ↓
Error: "table does not exist"
  ↓
capabilities.error = "Database sync error"
capabilities.ready = false
  ↓
RequireCapability shows error message
  ↓
Dashboard blocked (fail-safe)
```

### Scenario 2: Row Missing
```
CapabilityContext queries company_capabilities
  ↓
Error: PGRST116 (no rows)
  ↓
CapabilityContext creates row automatically
  ↓
capabilities.ready = true
  ↓
Dashboard loads
```

### Scenario 3: Network Error
```
CapabilityContext queries company_capabilities
  ↓
Error: Network timeout
  ↓
capabilities.error = "Network error"
capabilities.ready = false
  ↓
RequireCapability shows retry option
  ↓
User can retry
```

---

## 🔗 Table Relationships (Foreign Keys)

### Core Chain
```
auth.users
  └─ profiles (id → auth.users.id)
      └─ companies (profiles.company_id → companies.id)
          └─ company_capabilities (company_id → companies.id) ⭐
```

### Why This Chain Matters:
1. **User** → Identified by Supabase Auth
2. **Profile** → Links user to company
3. **Company** → Business entity
4. **Capabilities** → What company can do ⭐ **FOUNDATION**

### Supporting Tables
```
companies
  ├─ products (company_id)
  ├─ rfqs (buyer_company_id)
  ├─ orders (buyer_company_id, seller_company_id)
  ├─ notifications (company_id)
  └─ kyc_verifications (company_id) ⭐ NEW
```

---

## 🎯 Single Source of Truth

### ❌ OLD WAY (Multiple Sources)
```
profiles.role → 'buyer' | 'seller' | 'hybrid'
user_roles table → Multiple roles per user
roleHelpers.js → Calculates role from profile
```

**Problems:**
- Multiple sources conflict
- Hard to maintain
- Inconsistent state
- No approval workflow

### ✅ NEW WAY (Single Source)
```
company_capabilities table → ONE source of truth
  ├─ can_buy (boolean)
  ├─ can_sell (boolean)
  ├─ can_logistics (boolean)
  ├─ sell_status ('disabled'|'pending'|'approved')
  └─ logistics_status ('disabled'|'pending'|'approved')
```

**Benefits:**
- ✅ Single source of truth
- ✅ Approval workflow built-in
- ✅ Company-level (not user-level)
- ✅ Easy to query and update

---

## 🔄 Component Dependency Graph

```
App.jsx
  └─ CapabilityProvider
      └─ RequireCapability (route guard)
          └─ Dashboard
              └─ WorkspaceDashboard
                  └─ DashboardLayout
                      ├─ Reads: useCapability()
                      ├─ Builds: Sidebar menu
                      └─ Renders: <Outlet />
                          └─ Page Components
                              └─ RequireCapability (component guard)
                                  └─ Page Content
```

**Key Points:**
- CapabilityProvider wraps entire dashboard
- All components can access capabilities via `useCapability()`
- Route guard blocks before layout renders
- Component guard blocks specific features

---

## 🛠️ Fix Strategy

### Phase 1: Database Foundation (SQL)
1. Create `company_capabilities` table
2. Create `kyc_verifications` table
3. Create auto-creation trigger
4. Fix RLS policies

### Phase 2: Frontend Foundation (React)
1. Fix RequireCapability import
2. Add fail-safe error handling
3. Remove roleHelpers dependencies
4. Update API calls to match new tables

### Phase 3: Testing & Validation
1. Test capability loading
2. Test route guards
3. Test component guards
4. Test error scenarios

---

## 📋 Success Criteria

### ✅ Foundation is Strong When:

1. **Every company has capabilities row**
   - Trigger ensures auto-creation
   - No manual steps needed

2. **Dashboard loads without errors**
   - No 404 errors for capabilities
   - No 403 errors for notifications
   - No white screens

3. **Single source of truth**
   - No roleHelpers usage
   - All checks use `useCapability()`
   - Consistent behavior

4. **Graceful error handling**
   - Clear error messages
   - Retry options
   - No silent failures

5. **Security layers work**
   - RLS blocks unauthorized access
   - Route guards block routes
   - Component guards block features

---

## 🎯 The "Solid Foundation" Principles

1. **Idempotency**: Every company ALWAYS has capabilities (trigger)
2. **Single Source of Truth**: Capabilities table is the ONLY authority
3. **Fail-Safe**: Errors show messages, don't crash
4. **Defense in Depth**: Multiple security layers
5. **Auto-Recovery**: Missing rows auto-created
6. **Scalability**: Ready for future features

---

**Status:** 🏗️ **ARCHITECTURE VISUALIZED**

Now implementing the fixes to build this foundation.
