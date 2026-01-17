# Supabase Database Forensic Analysis - Complete Schema Review

## Executive Summary

This document provides a comprehensive forensic analysis of the Afrikoni Supabase database schema, including all tables, relationships, RLS policies, indexes, views, functions, and identified issues.

**Status:** 🔴 **CRITICAL ISSUES FOUND**

---

## 📊 Database Schema Overview

### Total Migration Files: 36
### Estimated Tables: 40+
### Views: 10+
### Functions: 20+
### Triggers: 15+

---

## 🔴 CRITICAL ISSUES

### 1. **MISSING TABLE: `company_capabilities`**

**Status:** ❌ **NOT APPLIED TO DATABASE**

**Migration File:** `supabase/migrations/20250127_company_capabilities.sql`

**Impact:**
- Dashboard cannot load capabilities
- All capability-based access control fails
- Route guards don't work
- Sidebar navigation broken

**Table Structure:**
```sql
CREATE TABLE IF NOT EXISTS public.company_capabilities (
  company_id UUID PRIMARY KEY REFERENCES public.companies(id) ON DELETE CASCADE,
  can_buy BOOLEAN NOT NULL DEFAULT true,
  can_sell BOOLEAN NOT NULL DEFAULT false,
  can_logistics BOOLEAN NOT NULL DEFAULT false,
  sell_status TEXT NOT NULL DEFAULT 'disabled' 
    CHECK (sell_status IN ('disabled', 'pending', 'approved')),
  logistics_status TEXT NOT NULL DEFAULT 'disabled' 
    CHECK (logistics_status IN ('disabled', 'pending', 'approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Dependencies:**
- Requires `companies` table to exist
- Auto-creates row when company is created (via trigger)
- Referenced by: `CapabilityContext.tsx`, `RequireCapability.tsx`

**Fix Required:**
```bash
# Apply migration
supabase migration up
# OR manually run SQL in Supabase dashboard
```

---

### 2. **MISSING TABLE: `kyc_verifications`**

**Status:** ⚠️ **REFERENCED BUT TABLE CREATION NOT FOUND**

**Error:** `404 (Not Found)` for `/rest/v1/kyc_verif...`

**Referenced In:**
- `supabase/migrations/20250115000002_optimize_rls_performance.sql` - RLS policies exist
- Code queries this table but table creation migration not found

**RLS Policies Exist:**
```sql
CREATE POLICY "Users can view their own KYC verifications" ON public.kyc_verifications
CREATE POLICY "Users can insert their own KYC verifications" ON public.kyc_verifications
CREATE POLICY "Users can update their own KYC verifications" ON public.kyc_verifications
```

**Issue:** Policies reference table that doesn't exist

**Fix Required:**
- Create `kyc_verifications` table OR
- Remove RLS policies if table not needed

---

### 3. **MIGRATION ORDER ISSUES**

**Problem:**
- Migrations have inconsistent naming (some with dates, some without)
- `001_create_profiles_table.sql` might conflict with later migrations
- Multiple migrations modify same tables (profiles, companies, products)

**Examples:**
- `001_create_profiles_table.sql` - Creates profiles
- `20241218_universal_user_visibility.sql` - Modifies profiles
- `20250124000002_fix_signup_database_errors.sql` - Modifies profiles
- `20260110_ultimate_fix.sql` - Modifies profiles

**Impact:**
- Potential conflicts if migrations run out of order
- Column additions might fail if table structure changed
- RLS policies might be overwritten

---

## 📋 COMPLETE TABLE INVENTORY

### Core Tables

#### 1. **profiles**
**Status:** ✅ Exists
**Migration:** `001_create_profiles_table.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY → `auth.users(id)`
- `full_name` TEXT
- `role` TEXT CHECK (role IN ('seller', 'buyer', 'hybrid', 'logistics'))
- `company_id` UUID → `companies(id)` (added later)
- `is_admin` BOOLEAN (added later)
- `account_status` TEXT (added later)
- `last_login_at` TIMESTAMPTZ (added later)

**RLS:** Enabled
**Indexes:** `profiles_role_idx`, `profiles_onboarding_completed_idx`, `idx_profiles_company_id`

**Issues:**
- Multiple migrations modify this table
- Role column might conflict with capability system

---

#### 2. **companies**
**Status:** ✅ Exists
**Migration:** `20251223_company_isolation.sql` (likely)
**Key Columns:**
- `id` UUID PRIMARY KEY
- `company_name` TEXT
- `owner_email` TEXT
- `country` TEXT
- `city` TEXT
- `role` TEXT (buyer/seller/hybrid/logistics)
- `verified` BOOLEAN
- `verification_status` TEXT
- `trust_score` NUMERIC
- `subscription_plan` TEXT
- `year_established` INTEGER (nullable)

**RLS:** Enabled
**Policies:** Multiple (select, insert, update)

**Issues:**
- `year_established` type changed in `20260110_fix_companies_and_notifications.sql`
- Multiple RLS policies might conflict

---

#### 3. **products**
**Status:** ✅ Exists
**Key Columns:**
- `id` UUID PRIMARY KEY
- `company_id` UUID → `companies(id)` (nullable after fix)
- `name` TEXT
- `description` TEXT
- `status` TEXT
- `category_id` UUID → `categories(id)`

**RLS:** Enabled
**Policies:** `anyone_can_view_products`, `authenticated_users_can_insert_products`, `authenticated_users_can_update_products`

**Issues:**
- `company_id` made nullable in `20260110_ultimate_fix.sql` (might break relationships)

---

#### 4. **product_images**
**Status:** ✅ Exists
**Key Columns:**
- `id` UUID PRIMARY KEY
- `product_id` UUID → `products(id)`
- `image_url` TEXT
- `is_primary` BOOLEAN

**RLS:** Enabled

---

#### 5. **categories**
**Status:** ✅ Exists
**Migration:** `20260110_ultimate_fix.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `name` VARCHAR(100) UNIQUE
- `slug` VARCHAR(100) UNIQUE
- `description` TEXT
- `icon` VARCHAR(50)

**RLS:** Enabled
**Default Data:** 14 categories inserted

---

### Trade & Commerce Tables

#### 6. **rfqs** (Request for Quotations)
**Status:** ✅ Exists (referenced in code)
**Key Columns:**
- `id` UUID PRIMARY KEY
- `buyer_company_id` UUID → `companies(id)`
- `category_id` UUID → `categories(id)`
- `status` TEXT
- `created_at` TIMESTAMPTZ

**RLS:** Enabled
**Policies:** `rfqs_select_buyer`, `rfqs_insert_buyer`, `rfqs_update_buyer`, `rfqs_delete_buyer`

**Issues:**
- 400 errors in console suggest RLS or query issues

---

#### 7. **quotes**
**Status:** ✅ Exists (referenced in code)
**Key Columns:**
- `id` UUID PRIMARY KEY
- `rfq_id` UUID → `rfqs(id)`
- `supplier_company_id` UUID → `companies(id)`
- `price` NUMERIC
- `status` TEXT

**RLS:** Likely enabled (not explicitly found)

---

#### 8. **orders**
**Status:** ✅ Exists
**Key Columns:**
- `id` UUID PRIMARY KEY
- `buyer_company_id` UUID → `companies(id)`
- `seller_company_id` UUID → `companies(id)`
- `total_amount` NUMERIC
- `status` TEXT
- `buyer_protection_fee` NUMERIC (added later)
- `buyer_protection_enabled` BOOLEAN (added later)

**RLS:** Enabled
**Policies:** `orders_select_involved`, `orders_insert_buyer`, `orders_update_involved`, `orders_delete_buyer`

---

#### 9. **returns**
**Status:** ✅ Exists (referenced in code)
**Key Columns:**
- `id` UUID PRIMARY KEY
- `order_id` UUID → `orders(id)`
- `buyer_company_id` UUID → `companies(id)`
- `seller_company_id` UUID → `companies(id)`
- `status` TEXT
- `requested_at` TIMESTAMPTZ

**RLS:** Likely enabled

---

### Messaging & Communication

#### 10. **messages**
**Status:** ✅ Exists
**Key Columns:**
- `id` UUID PRIMARY KEY
- `conversation_id` UUID → `conversations(id)`
- `sender_id` UUID → `auth.users(id)`
- `content` TEXT
- `read` BOOLEAN

**RLS:** Enabled
**Policies:** `messages_select_company`, `messages_insert_own`, `messages_update_read`

---

#### 11. **conversations**
**Status:** ✅ Exists (referenced in views)
**Key Columns:**
- `id` UUID PRIMARY KEY
- `buyer_company_id` UUID → `companies(id)`
- `seller_company_id` UUID → `companies(id)`
- `last_message_at` TIMESTAMPTZ

**RLS:** Likely enabled

---

#### 12. **notifications**
**Status:** ✅ Exists
**Migration:** `20260110_fix_companies_and_notifications.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID → `auth.users(id)` ON DELETE CASCADE
- `company_id` UUID → `companies(id)` ON DELETE CASCADE
- `title` VARCHAR(255)
- `message` TEXT
- `type` VARCHAR(50) CHECK (type IN ('info', 'success', 'warning', 'error'))
- `read` BOOLEAN DEFAULT FALSE
- `action_url` TEXT
- `metadata` JSONB
- `user_email` TEXT (added in later migration)

**RLS:** Enabled
**Policies:** Multiple (select, insert, update, delete)
**Indexes:** `idx_notifications_user_id`, `idx_notifications_company_id`, `idx_notifications_user_email`

**Issues:**
- 403 errors suggest RLS policy issues
- Multiple policies might conflict

---

### Financial & Revenue Tables

#### 13. **escrow_payments**
**Status:** ✅ Exists
**Migration:** `20250105000000_revenue_system.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `order_id` UUID → `orders(id)` ON DELETE CASCADE
- `buyer_company_id` UUID → `companies(id)` ON DELETE CASCADE
- `seller_company_id` UUID → `companies(id)` ON DELETE CASCADE
- `amount` NUMERIC(15, 2)
- `status` TEXT CHECK (status IN ('pending', 'held', 'partially_released', 'released', 'refunded', 'cancelled'))
- `commission_rate` NUMERIC(5, 2) DEFAULT 8.00
- `commission_amount` NUMERIC(15, 2)
- `net_payout_amount` NUMERIC(15, 2)

**RLS:** Enabled

---

#### 14. **escrow_events**
**Status:** ✅ Exists
**Migration:** `20250105000000_revenue_system.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `escrow_id` UUID → `escrow_payments(id)` ON DELETE CASCADE
- `event_type` TEXT CHECK (event_type IN ('hold', 'release', 'partial_release', 'refund', 'commission_deducted'))
- `amount` NUMERIC(15, 2)
- `created_by` UUID → `auth.users(id)`

**RLS:** Enabled

---

#### 15. **subscriptions**
**Status:** ✅ Exists
**Migration:** `20250115000000_create_subscriptions_table.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `company_id` UUID → `companies(id)` ON DELETE CASCADE
- `plan_type` TEXT CHECK (plan_type IN ('free', 'growth', 'elite'))
- `status` TEXT CHECK (status IN ('active', 'cancelled', 'expired', 'trial'))
- `monthly_price` NUMERIC(10, 2)
- `current_period_start` TIMESTAMPTZ
- `current_period_end` TIMESTAMPTZ

**RLS:** Enabled

---

#### 16. **verification_purchases**
**Status:** ✅ Exists
**Migration:** `20250105000000_revenue_system.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `company_id` UUID → `companies(id)` ON DELETE CASCADE
- `purchase_type` TEXT CHECK (purchase_type IN ('fast_track', 'standard'))
- `amount` NUMERIC(10, 2)
- `status` TEXT CHECK (status IN ('pending', 'completed', 'refunded'))

**RLS:** Enabled

---

#### 17. **revenue_transactions**
**Status:** ✅ Exists
**Migration:** `20250105000000_revenue_system.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `transaction_type` TEXT CHECK (transaction_type IN ('commission', 'subscription', 'logistics_margin', 'verification_fee', 'protection_fee'))
- `amount` NUMERIC(15, 2)
- `order_id` UUID → `orders(id)`
- `escrow_id` UUID → `escrow_payments(id)`
- `subscription_id` UUID → `subscriptions(id)`
- `logistics_quote_id` UUID → `logistics_quotes(id)`
- `company_id` UUID → `companies(id)`

**RLS:** Enabled

---

### Logistics Tables

#### 18. **shipments**
**Status:** ✅ Exists (referenced in code)
**Key Columns:**
- `id` UUID PRIMARY KEY
- `order_id` UUID → `orders(id)`
- `seller_company_id` UUID → `companies(id)`
- `logistics_partner_id` UUID → `companies(id)`
- `status` TEXT
- `is_cross_border` BOOLEAN (added later)
- `origin_country` TEXT (added later)
- `destination_country` TEXT (added later)
- `customs_clearance_id` UUID → `customs_clearance(id)` (added later)

**RLS:** Likely enabled

---

#### 19. **shipment_tracking_events**
**Status:** ✅ Exists
**Migration:** `20250110000000_logistics_tracking_and_customs.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `shipment_id` UUID → `shipments(id)` ON DELETE CASCADE
- `event_type` TEXT CHECK (event_type IN ('created', 'picked_up', 'in_transit', 'arrived_at_facility', 'departed_facility', 'in_customs', 'customs_cleared', 'out_for_delivery', 'delivery_attempted', 'delivered', 'exception', 'delay', 'returned'))
- `status` TEXT
- `location` TEXT
- `latitude` NUMERIC(10, 8)
- `longitude` NUMERIC(11, 8)
- `event_timestamp` TIMESTAMPTZ

**RLS:** Enabled
**Triggers:** `update_shipment_on_tracking_event` (auto-updates shipment status)

---

#### 20. **customs_clearance**
**Status:** ✅ Exists
**Migration:** `20250110000000_logistics_tracking_and_customs.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `shipment_id` UUID → `shipments(id)` ON DELETE CASCADE
- `order_id` UUID → `orders(id)` ON DELETE CASCADE
- `origin_country` TEXT
- `destination_country` TEXT
- `status` TEXT CHECK (status IN ('pending', 'submitted', 'under_review', 'requires_documents', 'requires_payment', 'cleared', 'rejected', 'held'))
- `declared_value` NUMERIC(15, 2)
- `duties_amount` NUMERIC(15, 2)
- `taxes_amount` NUMERIC(15, 2)

**RLS:** Enabled

---

#### 21. **logistics_quotes**
**Status:** ✅ Exists
**Migration:** `20250105000000_revenue_system.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `order_id` UUID → `orders(id)` ON DELETE CASCADE
- `company_id` UUID → `companies(id)` ON DELETE CASCADE
- `logistics_partner_id` UUID → `companies(id)`
- `pickup_country` TEXT
- `delivery_country` TEXT
- `base_price` NUMERIC(10, 2)
- `afrikoni_markup_percent` NUMERIC(5, 2) DEFAULT 5.00
- `final_price` NUMERIC(10, 2)
- `status` TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'))

**RLS:** Enabled

---

### Trust & Safety Tables

#### 22. **reviews**
**Status:** ✅ Exists (referenced in code)
**Key Columns:**
- `id` UUID PRIMARY KEY
- `order_id` UUID → `orders(id)`
- `buyer_company_id` UUID → `companies(id)`
- `seller_company_id` UUID → `companies(id)`
- `rating` INTEGER
- `comment` TEXT
- `status` TEXT (pending/approved/rejected)

**RLS:** Enabled
**Policies:** Multiple (buyers, sellers, admins)

---

#### 23. **disputes**
**Status:** ✅ Exists (referenced in views)
**Key Columns:**
- `id` UUID PRIMARY KEY
- `order_id` UUID → `orders(id)`
- `buyer_company_id` UUID → `companies(id)`
- `seller_company_id` UUID → `companies(id)`
- `status` TEXT

**RLS:** Likely enabled

---

### Analytics & Intelligence Tables

#### 24. **activity_logs**
**Status:** ✅ Exists
**Migration:** `20250104000000_create_activity_logs_table.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID → `auth.users(id)` ON DELETE CASCADE
- `activity_type` TEXT
- `metadata` JSONB

**RLS:** Likely enabled

---

#### 25. **search_events**
**Status:** ✅ Exists (referenced in admin analytics)
**Key Columns:**
- `id` UUID PRIMARY KEY
- `query` TEXT
- `filters` JSONB
- `result_count` INTEGER
- `created_at` TIMESTAMPTZ

**RLS:** Likely enabled

---

### Content & Marketing Tables

#### 26. **testimonials**
**Status:** ✅ Exists
**Migration:** `20250101000000_create_testimonials_and_partners.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `company_name` TEXT
- `testimonial_text` TEXT
- `rating` INTEGER
- `approved` BOOLEAN

**RLS:** Likely enabled

---

#### 27. **partners**
**Status:** ✅ Exists
**Migration:** `20250101000000_create_testimonials_and_partners.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `name` TEXT
- `logo_url` TEXT
- `website_url` TEXT

**RLS:** Likely enabled

---

#### 28. **faqs**
**Status:** ✅ Exists
**Migration:** `20250102000000_create_faqs_table.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `question` TEXT
- `answer` TEXT
- `category` TEXT
- `order` INTEGER

**RLS:** Likely enabled

---

#### 29. **newsletter_subscriptions**
**Status:** ✅ Exists
**Migration:** `20250103000000_create_newsletter_and_downloads_tables.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `email` TEXT UNIQUE
- `subscribed_at` TIMESTAMPTZ

**RLS:** Likely enabled

---

#### 30. **downloads**
**Status:** ✅ Exists
**Migration:** `20250103000000_create_newsletter_and_downloads_tables.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `title` TEXT
- `file_url` TEXT
- `download_count` INTEGER

**RLS:** Likely enabled

---

### Auth & Enterprise Tables

#### 31. **roles**
**Status:** ✅ Exists
**Migration:** `20251218_enterprise_auth_extensions.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `name` TEXT UNIQUE ('buyer', 'seller', 'logistics')

**Default Data:** Seeded with buyer, seller, logistics

---

#### 32. **user_roles**
**Status:** ✅ Exists
**Migration:** `20251218_enterprise_auth_extensions.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID → `auth.users(id)` ON DELETE CASCADE
- `role_id` UUID → `roles(id)` ON DELETE CASCADE
- UNIQUE(user_id, role_id)

**RLS:** Likely enabled

**Note:** This might conflict with capability system

---

#### 33. **business_profiles**
**Status:** ✅ Exists
**Migration:** `20251218_enterprise_auth_extensions.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID → `auth.users(id)` ON DELETE CASCADE UNIQUE
- `company_name` TEXT
- `verification_status` TEXT DEFAULT 'pending'
- `reviewed_by_admin_id` UUID → `auth.users(id)`

**RLS:** Enabled

---

#### 34. **auth_logs**
**Status:** ✅ Exists
**Migration:** `20251218_enterprise_auth_extensions.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID → `auth.users(id)` ON DELETE SET NULL
- `event_type` TEXT
- `ip_address` TEXT
- `created_at` TIMESTAMPTZ

**RLS:** Likely enabled

---

#### 35. **login_attempts**
**Status:** ✅ Exists
**Migration:** `20251218_enterprise_auth_extensions.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `email` TEXT
- `success` BOOLEAN
- `ip_address` TEXT
- `created_at` TIMESTAMPTZ

**RLS:** Likely enabled

---

#### 36. **user_preferences**
**Status:** ✅ Exists
**Migration:** `20251218_enterprise_auth_extensions.sql`
**Key Columns:**
- `id` UUID PRIMARY KEY
- `user_id` UUID → `auth.users(id)` ON DELETE CASCADE UNIQUE
- `preferences` JSONB

**RLS:** Likely enabled

---

### Missing Tables (Referenced but Not Found)

#### ❌ **kyc_verifications**
**Status:** MISSING
**Referenced In:**
- `20250115000002_optimize_rls_performance.sql` - RLS policies exist
- Code queries this table
- Console shows 404 errors

**Issue:** Policies exist but table doesn't

---

#### ❌ **wallet_transactions**
**Status:** MISSING (referenced in admin analytics)
**Referenced In:**
- `src/pages/dashboard/admin/analytics.jsx` - Queries this table
- Console might show errors

---

#### ❌ **decision_audit_log**
**Status:** MISSING (referenced in RLS policies)
**Referenced In:**
- `20250124180000_optimize_rls_policies.sql` - RLS policies exist

---

#### ❌ **contact_submissions**
**Status:** MISSING (referenced in RLS policies)
**Referenced In:**
- `20250124180000_optimize_rls_policies.sql` - RLS policies exist

---

## 🔗 FOREIGN KEY RELATIONSHIPS

### Core Relationships

```
auth.users
  └─ profiles (id → auth.users.id)
      └─ companies (profiles.company_id → companies.id)

companies
  ├─ profiles (company_id)
  ├─ products (company_id)
  ├─ rfqs (buyer_company_id, seller_company_id)
  ├─ quotes (supplier_company_id)
  ├─ orders (buyer_company_id, seller_company_id)
  ├─ shipments (seller_company_id, logistics_partner_id)
  ├─ company_capabilities (company_id) ❌ MISSING
  ├─ subscriptions (company_id)
  ├─ verification_purchases (company_id)
  └─ logistics_quotes (company_id, logistics_partner_id)

orders
  ├─ escrow_payments (order_id)
  ├─ returns (order_id)
  ├─ shipments (order_id)
  ├─ reviews (order_id)
  ├─ disputes (order_id)
  ├─ customs_clearance (order_id)
  └─ revenue_transactions (order_id)

rfqs
  ├─ quotes (rfq_id)
  └─ (referenced in views)

products
  ├─ product_images (product_id)
  └─ categories (category_id)

shipments
  ├─ shipment_tracking_events (shipment_id)
  └─ customs_clearance (shipment_id)

conversations
  └─ messages (conversation_id)
```

---

## 🔒 ROW LEVEL SECURITY (RLS) ANALYSIS

### RLS Status by Table

| Table | RLS Enabled | Policies Count | Issues |
|-------|-------------|---------------|---------|
| profiles | ✅ Yes | 3+ | Multiple migrations modify policies |
| companies | ✅ Yes | 3+ | Multiple policies might conflict |
| products | ✅ Yes | 3 | Permissive policies (anyone can view) |
| product_images | ✅ Yes | 2 | |
| categories | ✅ Yes | 1 | Public access |
| rfqs | ✅ Yes | 4 | 400 errors suggest issues |
| quotes | ⚠️ Unknown | - | Not explicitly found |
| orders | ✅ Yes | 4 | |
| returns | ⚠️ Unknown | - | |
| messages | ✅ Yes | 3 | |
| conversations | ⚠️ Unknown | - | |
| notifications | ✅ Yes | 4+ | 403 errors, multiple policies |
| escrow_payments | ✅ Yes | Multiple | |
| subscriptions | ✅ Yes | Multiple | |
| shipments | ⚠️ Unknown | - | |
| shipment_tracking_events | ✅ Yes | 2 | |
| customs_clearance | ✅ Yes | 2 | |
| reviews | ✅ Yes | Multiple | |
| disputes | ⚠️ Unknown | - | |
| company_capabilities | ✅ Yes (in migration) | 3 | ❌ TABLE MISSING |

---

## 📈 DATABASE VIEWS

### Intelligence Views

1. **buyer_intelligence**
   - Aggregates buyer metrics
   - RFQs, conversations, orders, financial metrics
   - Buyer segmentation

2. **supplier_intelligence**
   - Supplier performance metrics
   - Response times, completion rates, dispute rates
   - Reliability scores

3. **trade_performance**
   - Trade funnel metrics
   - Conversion rates
   - Revenue metrics

4. **demand_intelligence**
   - RFQ demand analysis
   - Category trends
   - Geographic demand

5. **risk_signals**
   - Dispute patterns
   - Conversation analysis
   - Risk scoring

6. **complete_user_view**
   - User visibility view
   - Combines profiles, companies, activity

**Migration:** `20250120000000_trade_intelligence_system.sql`, `20250120000001_trade_intelligence_views.sql`

---

## ⚙️ FUNCTIONS & TRIGGERS

### Key Functions

1. **update_updated_at_column()**
   - Updates `updated_at` timestamp
   - Used by multiple tables

2. **create_company_capabilities_on_company_insert()**
   - Auto-creates capabilities row
   - Triggered on company insert
   - ❌ TABLE MISSING

3. **ensure_company_capabilities_exists(p_company_id UUID)**
   - Idempotent function to create capabilities
   - ❌ TABLE MISSING

4. **update_shipment_from_tracking()**
   - Auto-updates shipment status from tracking events
   - Triggered on tracking event insert

5. **detect_cross_border_shipment()**
   - Auto-detects cross-border shipments
   - Triggered on shipment insert/update

### Key Triggers

1. **update_profiles_updated_at**
   - Updates profiles.updated_at

2. **company_capabilities_auto_create**
   - Creates capabilities on company insert
   - ❌ TABLE MISSING

3. **company_capabilities_updated_at_trigger**
   - Updates capabilities.updated_at
   - ❌ TABLE MISSING

4. **update_shipment_on_tracking_event**
   - Updates shipment from tracking event

5. **detect_cross_border**
   - Detects cross-border shipments

---

## 🔍 INDEX ANALYSIS

### Critical Indexes

**Profiles:**
- `profiles_role_idx` - Role lookups
- `profiles_onboarding_completed_idx` - Onboarding status
- `idx_profiles_company_id` - Company relationships

**Companies:**
- `idx_companies_owner_email` - Owner lookups
- `idx_company_capabilities_sell_status` - ❌ TABLE MISSING
- `idx_company_capabilities_logistics_status` - ❌ TABLE MISSING

**Products:**
- `idx_products_company_id` - Company products
- `idx_products_status` - Status filtering
- `idx_products_created_at` - Date sorting

**Orders:**
- Multiple indexes on status, dates, company IDs

**Notifications:**
- `idx_notifications_user_id` - User notifications
- `idx_notifications_company_id` - Company notifications
- `idx_notifications_user_email` - Email lookups
- `idx_notifications_created_at` - Date sorting
- `idx_notifications_read` - Unread filtering

**RFQs:**
- Indexes on buyer_company_id, status, dates

**Intelligence Views:**
- Multiple indexes on company_id, dates, statuses

---

## 🚨 IDENTIFIED ISSUES

### Critical Issues

1. **❌ Missing `company_capabilities` table**
   - Blocks dashboard functionality
   - Migration exists but not applied

2. **❌ Missing `kyc_verifications` table**
   - RLS policies exist but table doesn't
   - Causes 404 errors

3. **⚠️ Missing `wallet_transactions` table**
   - Referenced in admin analytics
   - Might cause errors

4. **⚠️ Missing `decision_audit_log` table**
   - RLS policies exist but table doesn't

5. **⚠️ Missing `contact_submissions` table**
   - RLS policies exist but table doesn't

### High Priority Issues

6. **Multiple migrations modify same tables**
   - Profiles, companies, products modified multiple times
   - Risk of conflicts

7. **RLS policy conflicts**
   - Multiple policies on same tables
   - Some policies might override others

8. **Nullable foreign keys**
   - `products.company_id` made nullable
   - Might break relationships

9. **Inconsistent migration naming**
   - Some with dates, some without
   - Hard to track order

### Medium Priority Issues

10. **Role system conflicts**
    - `profiles.role` column exists
    - `user_roles` table exists
    - `company_capabilities` system exists
    - Three different role systems

11. **Missing indexes**
    - Some frequently queried columns might lack indexes
    - Performance impact

12. **View dependencies**
    - Views depend on tables that might not exist
    - Views might fail if tables missing

---

## 📊 TABLE USAGE IN CODEBASE

### Most Referenced Tables

1. **profiles** - 50+ references
2. **companies** - 40+ references
3. **products** - 30+ references
4. **orders** - 25+ references
5. **rfqs** - 20+ references
6. **notifications** - 15+ references
7. **messages** - 10+ references
8. **quotes** - 10+ references
9. **reviews** - 8+ references
10. **shipments** - 8+ references

### Tables Referenced But Might Not Exist

- `kyc_verifications` - Referenced in code, 404 errors
- `wallet_transactions` - Referenced in admin analytics
- `company_capabilities` - Referenced everywhere, table missing

---

## 🔧 RECOMMENDATIONS

### Immediate Actions

1. **Apply `company_capabilities` migration** (CRITICAL)
   ```sql
   -- Run: supabase/migrations/20250127_company_capabilities.sql
   ```

2. **Create missing tables or remove policies**
   - Create `kyc_verifications` table OR remove RLS policies
   - Create `wallet_transactions` table OR remove references
   - Create `decision_audit_log` table OR remove policies
   - Create `contact_submissions` table OR remove policies

3. **Audit RLS policies**
   - Check for conflicting policies
   - Consolidate duplicate policies
   - Test policy effectiveness

### Long-term Improvements

4. **Consolidate role systems**
   - Choose one: profiles.role OR user_roles OR capabilities
   - Migrate to single system
   - Remove unused systems

5. **Standardize migrations**
   - Use consistent naming: `YYYYMMDD_HHMMSS_description.sql`
   - Document migration dependencies
   - Test migrations in order

6. **Add missing indexes**
   - Analyze query patterns
   - Add indexes for frequently queried columns
   - Monitor query performance

7. **Document schema**
   - Create ER diagram
   - Document all relationships
   - Document RLS policies

---

## 📋 VERIFICATION QUERIES

### Check Missing Tables

```sql
-- Check if company_capabilities exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'company_capabilities'
);

-- Check if kyc_verifications exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'kyc_verifications'
);

-- List all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

### Check Foreign Key Integrity

```sql
-- Check for orphaned records
SELECT COUNT(*) as orphaned_profiles
FROM profiles p
LEFT JOIN companies c ON p.company_id = c.id
WHERE p.company_id IS NOT NULL AND c.id IS NULL;

-- Check for missing capabilities
SELECT COUNT(*) as companies_without_capabilities
FROM companies c
LEFT JOIN company_capabilities cc ON c.id = cc.company_id
WHERE cc.company_id IS NULL;
```

### Check RLS Policies

```sql
-- List all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

---

## 📝 SUMMARY

**Total Tables:** ~40 tables
**Missing Tables:** 5+ (company_capabilities, kyc_verifications, wallet_transactions, decision_audit_log, contact_submissions)
**Views:** 10+
**Functions:** 20+
**Triggers:** 15+
**RLS Policies:** 50+

**Critical Issues:** 5
**High Priority Issues:** 4
**Medium Priority Issues:** 3

**Status:** 🔴 **DATABASE INCOMPLETE - CRITICAL TABLES MISSING**

The database schema is mostly complete but has critical gaps that prevent the dashboard from functioning. The `company_capabilities` table is the most critical missing piece.

---

**Next Steps:**
1. Apply `company_capabilities` migration
2. Create or remove missing table references
3. Audit and fix RLS policies
4. Consolidate role systems
5. Test all relationships
