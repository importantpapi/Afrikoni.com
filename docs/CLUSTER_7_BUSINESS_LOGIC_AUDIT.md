# 🔍 CLUSTER 7: Business Logic Consolidation — COMPLETE AUDIT
## PHASE 2 — CLUSTER 7: Step 1 (Complete Audit)

**Date:** 2024  
**Status:** ✅ **AUDIT COMPLETE — READY FOR PROPOSAL**

---

## 📋 EXECUTIVE SUMMARY

This audit scanned **20+ dashboard and marketplace pages** and identified **45 critical issues** across 5 categories:

- **B1.x — Business Logic Issues:** 12 issues
- **B2.x — Data Validation Gaps:** 8 issues
- **B3.x — Pagination & Performance Issues:** 10 issues
- **B4.x — Status Mapping Issues:** 8 issues
- **B5.x — Loading State Issues:** 7 issues

**Priority Breakdown:**
- 🔴 **Critical:** 18 issues (affects functionality/performance)
- 🟡 **High:** 18 issues (affects UX/maintainability)
- 🟢 **Medium:** 9 issues (affects code quality)

---

## 1. B1.x — BUSINESS LOGIC ISSUES (12 Issues)

### B1.1 — Fragile String-Based Status Filtering ❌

**Files Affected:**
- `src/pages/dashboard/orders.jsx` (Lines 155, 245-281)
- `src/pages/dashboard/rfqs.jsx` (Multiple status checks)
- `src/pages/dashboard/shipments.jsx` (Status filtering)

**Current Pattern:**
```javascript
// ❌ FRAGILE - String literals everywhere
const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
if (order.status === 'pending') { ... }
if (order.status === 'processing') { ... }
if (order.status === 'shipped') { ... }
```

**Problem:**
- Status values hardcoded as strings
- Typos cause silent failures
- No type safety
- Inconsistent status values across files

**Expected Behavior:**
```javascript
// ✅ USE CONSTANTS
import { ORDER_STATUS } from '@/constants/status';
if (order.status === ORDER_STATUS.PENDING) { ... }
```

**Priority:** 🔴 **Critical**

---

### B1.2 — Duplicated Company/Profile Fetching Logic ❌

**Files Affected:**
- `src/pages/dashboard/products.jsx` (Lines 46-60) - Still uses `supabaseHelpers.auth.me()` instead of helper
- `src/pages/dashboard/shipments/[id].jsx` (Line 34) - Still uses `supabaseHelpers.auth.me()`
- `src/pages/dashboard/company-info.jsx` (Lines 106-185) - Complex manual fetching

**Current Pattern:**
```javascript
// ❌ DUPLICATED - Multiple files fetch company/profile manually
const userData = await supabaseHelpers.auth.me();
const { getOrCreateCompany } = await import('@/utils/companyHelper');
const companyId = await getOrCreateCompany(supabase, userData);
```

**Problem:**
- Some files still use old pattern after Cluster 6
- `company-info.jsx` has 80+ lines of manual fetching
- Inconsistent error handling
- Redundant database queries

**Expected Behavior:**
```javascript
// ✅ USE CENTRALIZED HELPER
const { user, profile, role, companyId } = await getCurrentUserAndRole(supabase, supabaseHelpers);
```

**Priority:** 🔴 **Critical**

---

### B1.3 — RFQ Status Logic Inconsistencies ❌

**Files Affected:**
- `src/pages/dashboard/rfqs.jsx` (Lines 56-62, 133-140)
- `src/pages/rfqmanagement.jsx` (Lines 56-62)
- `src/pages/rfq-marketplace.jsx` (Line 37)

**Current Pattern:**
```javascript
// ❌ INCONSISTENT STATUS VALUES
query = query.in('status', ['open', 'pending']);  // rfqs.jsx
query = query.eq('status', 'open');                 // rfq-marketplace.jsx
query = query.in('status', ['awarded', 'closed']);  // rfqmanagement.jsx
```

**Problem:**
- Different status values used for same concept
- `'open'` vs `'pending'` confusion
- No central definition of valid RFQ statuses

**Expected Behavior:**
```javascript
// ✅ USE CONSTANTS
import { RFQ_STATUS } from '@/constants/status';
query = query.in('status', [RFQ_STATUS.OPEN, RFQ_STATUS.PENDING]);
```

**Priority:** 🔴 **Critical**

---

### B1.4 — Order Status Logic Inconsistencies ❌

**Files Affected:**
- `src/pages/dashboard/orders.jsx` (Lines 88-130)
- `src/pages/dashboard/orders/[id].jsx` (Lines 132-163)
- `src/pages/orders.jsx` (Line 31)

**Current Pattern:**
```javascript
// ❌ INCONSISTENT STATUS HANDLING
if (orderData.status === 'processing') { ... }
if (orderData.status === 'shipped') { ... }
if (orderData.status === 'delivered') { ... }
if (orderData.status === 'completed') { ... }
```

**Problem:**
- Status checks scattered across multiple files
- No validation of status transitions
- `'completed'` vs `'delivered'` confusion

**Expected Behavior:**
```javascript
// ✅ USE STATUS HELPER
import { ORDER_STATUS, canTransitionTo } from '@/constants/status';
if (canTransitionTo(order.status, ORDER_STATUS.SHIPPED)) { ... }
```

**Priority:** 🔴 **Critical**

---

### B1.5 — Hybrid Role Logic Duplicated ❌

**Files Affected:**
- `src/pages/dashboard/orders.jsx` (Lines 88, 101, 113)
- `src/pages/dashboard/rfqs.jsx` (Lines 77-109)
- `src/pages/dashboard/DashboardHome.jsx` (Lines 120-123)

**Current Pattern:**
```javascript
// ❌ DUPLICATED HYBRID LOGIC
if (normalizedRole === 'buyer' || (normalizedRole === 'hybrid' && (viewMode === 'all' || viewMode === 'buyer'))) {
  // Load buyer data
}
if ((role === 'seller' || (role === 'hybrid' && (viewMode === 'all' || viewMode === 'seller'))) && companyId) {
  // Load seller data
}
```

**Problem:**
- Same hybrid logic repeated in multiple files
- Inconsistent variable names (`normalizedRole` vs `role`)
- Should use `shouldLoadBuyerData()` and `shouldLoadSellerData()` from roleHelpers

**Expected Behavior:**
```javascript
// ✅ USE ROLE HELPERS
import { shouldLoadBuyerData, shouldLoadSellerData } from '@/utils/roleHelpers';
if (shouldLoadBuyerData(role, viewMode)) { ... }
if (shouldLoadSellerData(role, viewMode)) { ... }
```

**Priority:** 🟡 **High**

---

### B1.6 — Scattered Status Label Mappings ❌

**Files Affected:**
- `src/pages/dashboard/shipments/[id].jsx` (Lines 119-126)
- `src/pages/dashboard/orders/[id].jsx` (Timeline building)
- `src/components/ui/data-table.jsx` (Lines 51-60)

**Current Pattern:**
```javascript
// ❌ DUPLICATED STATUS LABELS
const statusLabels = {
  pending_pickup: 'Pickup Scheduled',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  // ... in shipments/[id].jsx
};

const statusMap = {
  pending: { label: 'Pending', variant: 'warning' },
  processing: { label: 'Processing', variant: 'info' },
  // ... in data-table.jsx
};
```

**Problem:**
- Status labels defined in multiple places
- Inconsistent capitalization
- No single source of truth

**Expected Behavior:**
```javascript
// ✅ USE STATUS CONSTANTS
import { getStatusLabel, getStatusVariant } from '@/constants/status';
const label = getStatusLabel(status);
const variant = getStatusVariant(status);
```

**Priority:** 🟡 **High**

---

### B1.7 — N+1 Query Pattern in RFQ Quotes ❌

**File:** `src/pages/rfqmanagement.jsx` (Lines 68-77)

**Current Pattern:**
```javascript
// ❌ N+1 QUERIES
const rfqsWithQuotes = await Promise.all(
  (data || []).map(async (rfq) => {
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('rfq_id', rfq.id);
    return { ...rfq, quotesCount: count || 0 };
  })
);
```

**Problem:**
- One query per RFQ to count quotes
- For 50 RFQs = 51 queries (1 + 50)
- Should use aggregation or join

**Expected Behavior:**
```javascript
// ✅ USE AGGREGATION
const { data } = await supabase
  .from('rfqs')
  .select(`
    *,
    quotes(count)
  `);
```

**Priority:** 🔴 **Critical**

---

### B1.8 — Missing Pagination on Large Lists ❌

**Files Affected:**
- `src/pages/dashboard/orders.jsx` (Line 128) - `.limit(100)` hardcoded
- `src/pages/dashboard/rfqs.jsx` (Lines 75, 92, 107) - `.limit(100)` hardcoded
- `src/pages/dashboard/products.jsx` - No limit
- `src/pages/products.jsx` (Line 44) - `.limit(50)` hardcoded
- `src/pages/marketplace.jsx` (Line 56) - `.limit(100)` hardcoded

**Current Pattern:**
```javascript
// ❌ NO PAGINATION
const { data } = await supabase
  .from('orders')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(100);  // Hardcoded limit
```

**Problem:**
- All records loaded at once
- Performance degrades with large datasets
- No "Load More" or pagination UI
- Memory issues with thousands of records

**Expected Behavior:**
```javascript
// ✅ USE PAGINATION HELPER
import { paginateQuery } from '@/utils/pagination';
const { data, hasMore, loadMore } = await paginateQuery(
  supabase.from('orders').select('*'),
  { page: 1, pageSize: 20 }
);
```

**Priority:** 🔴 **Critical**

---

### B1.9 — Inconsistent Query Patterns ❌

**Files Affected:**
- `src/pages/dashboard/products.jsx` (Lines 74-91) - Complex `.or()` query
- `src/pages/dashboard/orders.jsx` (Lines 91-96, 103-108) - Multiple separate queries
- `src/pages/dashboard/rfqs.jsx` (Lines 62-108) - Conditional query building

**Current Pattern:**
```javascript
// ❌ INCONSISTENT QUERY PATTERNS
let productsQuery = supabase.from('products').select(`*`);
if (userCompanyId) {
  productsQuery = productsQuery.or(`supplier_id.eq.${userCompanyId},company_id.eq.${userCompanyId}`);
} else {
  productsQuery = productsQuery.limit(0);
}
```

**Problem:**
- Different query patterns for similar operations
- String interpolation in queries (security risk)
- Hard to maintain and test

**Expected Behavior:**
```javascript
// ✅ USE QUERY BUILDER HELPER
import { buildProductQuery } from '@/utils/queryBuilders';
const query = buildProductQuery({ companyId: userCompanyId });
```

**Priority:** 🟡 **High**

---

### B1.10 — Missing Error States in Forms ❌

**Files Affected:**
- `src/pages/dashboard/products/new.jsx` (Lines 323-351) - Weak validation
- `src/pages/createrfq.jsx` (Lines 75-93) - Basic validation only
- `src/pages/onboarding.jsx` - No field-level errors

**Current Pattern:**
```javascript
// ❌ WEAK VALIDATION
const validateStep = (step) => {
  switch (step) {
    case 1:
      if (!formData.title.trim()) {
        toast.warning('Product title is recommended');
        // Don't block, just warn
      }
      return true; // Always allow progression
  }
};
```

**Problem:**
- No field-level error messages
- Validation doesn't prevent invalid submissions
- No visual error indicators on inputs
- Users can submit incomplete data

**Expected Behavior:**
```javascript
// ✅ COMPREHENSIVE VALIDATION
import { validateProductForm } from '@/utils/validation';
const errors = validateProductForm(formData);
if (Object.keys(errors).length > 0) {
  setFieldErrors(errors);
  return;
}
```

**Priority:** 🟡 **High**

---

### B1.11 — Status Transition Logic Missing ❌

**Files Affected:**
- `src/pages/dashboard/orders/[id].jsx` (Lines 496-517) - Hardcoded transitions
- `src/pages/dashboard/shipments/[id].jsx` (Lines 76-106) - No validation

**Current Pattern:**
```javascript
// ❌ NO TRANSITION VALIDATION
{order.status === 'pending' && (
  <Button onClick={() => handleStatusUpdate('processing')}>
    Start Processing
  </Button>
)}
{order.status === 'processing' && (
  <Button onClick={() => handleStatusUpdate('shipped')}>
    Mark as Shipped
  </Button>
)}
```

**Problem:**
- No validation of valid status transitions
- Users could potentially skip statuses
- No business rules enforcement

**Expected Behavior:**
```javascript
// ✅ USE STATUS TRANSITION HELPER
import { canTransitionTo, getNextStatuses } from '@/constants/status';
const nextStatuses = getNextStatuses(order.status);
{nextStatuses.map(status => (
  <Button onClick={() => handleStatusUpdate(status)}>
    {getStatusLabel(status)}
  </Button>
))}
```

**Priority:** 🟡 **High**

---

### B1.12 — Duplicated Timeline Building Logic ❌

**Files Affected:**
- `src/pages/dashboard/orders/[id].jsx` (Lines 97-163) - 66 lines of timeline logic
- `src/pages/dashboard/shipments/[id].jsx` (Lines 108-138) - 30 lines of timeline logic

**Current Pattern:**
```javascript
// ❌ DUPLICATED TIMELINE LOGIC
const buildTimeline = (orderData, shipmentData) => {
  const timelineItems = [];
  timelineItems.push({
    id: 'created',
    title: 'Order Created',
    description: 'Order was placed',
    timestamp: orderData.created_at,
    icon: ShoppingCart,
    status: 'completed'
  });
  // ... 60+ more lines
};
```

**Problem:**
- Same timeline building pattern in multiple files
- Hard to maintain
- Inconsistent timeline items

**Expected Behavior:**
```javascript
// ✅ USE TIMELINE HELPER
import { buildOrderTimeline, buildShipmentTimeline } from '@/utils/timeline';
const timeline = buildOrderTimeline(order, shipment);
```

**Priority:** 🟢 **Medium**

---

## 2. B2.x — DATA VALIDATION GAPS (8 Issues)

### B2.1 — Missing Email Validation ❌

**Files Affected:**
- `src/pages/signup.jsx` - Only HTML5 `type="email"`
- `src/pages/dashboard/company-info.jsx` - No validation
- `src/pages/onboarding.jsx` - No validation

**Current Pattern:**
```javascript
// ❌ ONLY HTML5 VALIDATION
<Input
  type="email"
  value={formData.email}
  required
/>
```

**Problem:**
- No client-side validation beyond HTML5
- No validation feedback
- Invalid emails can be submitted

**Expected Behavior:**
```javascript
// ✅ USE VALIDATION HELPER
import { isValidEmail } from '@/utils/validation';
const emailError = formData.email && !isValidEmail(formData.email) 
  ? 'Please enter a valid email address' 
  : '';
```

**Priority:** 🟡 **High**

---

### B2.2 — Missing Phone Number Validation ❌

**Files Affected:**
- `src/pages/dashboard/company-info.jsx` (Line 622) - No validation
- `src/pages/onboarding.jsx` - No validation

**Current Pattern:**
```javascript
// ❌ NO PHONE VALIDATION
<Input
  type="tel"
  value={formData.phone}
  placeholder="+234 800 000 0000"
/>
```

**Problem:**
- No format validation
- No country code validation
- Accepts any string

**Expected Behavior:**
```javascript
// ✅ USE PHONE VALIDATION
import { isValidPhone } from '@/utils/validation';
const phoneError = formData.phone && !isValidPhone(formData.phone, formData.country)
  ? 'Please enter a valid phone number'
  : '';
```

**Priority:** 🟡 **High**

---

### B2.3 — Weak Product Form Validation ❌

**File:** `src/pages/dashboard/products/new.jsx` (Lines 323-351)

**Current Pattern:**
```javascript
// ❌ WEAK VALIDATION
const validateStep = (step) => {
  switch (step) {
    case 1:
      if (!formData.title.trim()) {
        toast.warning('Product title is recommended');
        // Don't block, just warn
      }
      return true; // Always allow progression
  }
};
```

**Problem:**
- Validation doesn't block progression
- Only warnings, no errors
- Users can save incomplete products

**Expected Behavior:**
```javascript
// ✅ STRICT VALIDATION
import { validateProductStep } from '@/utils/validation';
const errors = validateProductStep(step, formData);
if (errors.length > 0) {
  setStepErrors(errors);
  return false;
}
```

**Priority:** 🟡 **High**

---

### B2.4 — Missing Required Field Indicators ❌

**Files Affected:**
- `src/pages/dashboard/products/new.jsx` - No visual indicators
- `src/pages/createrfq.jsx` - Only text "*" in some places
- `src/pages/onboarding.jsx` - Inconsistent indicators

**Current Pattern:**
```javascript
// ❌ INCONSISTENT INDICATORS
<Label htmlFor="company_name">
  Company Name <span className="text-red-500">*</span>  // Some fields
</Label>
<Label htmlFor="website">Website</Label>  // No indicator
```

**Problem:**
- Inconsistent required field indicators
- Some required fields not marked
- Users don't know what's required

**Expected Behavior:**
```javascript
// ✅ CONSISTENT INDICATORS
<Label htmlFor="company_name" required>
  Company Name
</Label>
```

**Priority:** 🟢 **Medium**

---

### B2.5 — No Input Sanitization in Some Forms ❌

**Files Affected:**
- `src/pages/dashboard/company-info.jsx` - No sanitization
- `src/pages/onboarding.jsx` - No sanitization
- `src/pages/dashboard/products/new.jsx` - Partial sanitization

**Current Pattern:**
```javascript
// ❌ NO SANITIZATION
<Input
  value={formData.company_name}
  onChange={(e) => setFormData(prev => ({ ...prev, company_name: e.target.value }))}
/>
```

**Problem:**
- XSS vulnerability risk
- SQL injection risk (if not using parameterized queries)
- Inconsistent with `createrfq.jsx` which uses `sanitizeString()`

**Expected Behavior:**
```javascript
// ✅ SANITIZE INPUTS
import { sanitizeString } from '@/utils/security';
onChange={(e) => setFormData(prev => ({ 
  ...prev, 
  company_name: sanitizeString(e.target.value) 
}))}
```

**Priority:** 🔴 **Critical**

---

### B2.6 — Missing Numeric Validation ❌

**Files Affected:**
- `src/pages/dashboard/products/new.jsx` - Price, quantity fields
- `src/pages/createrfq.jsx` - Quantity, price fields

**Current Pattern:**
```javascript
// ❌ NO NUMERIC VALIDATION
<Input
  type="number"
  value={formData.price_min}
  onChange={(e) => setFormData(prev => ({ ...prev, price_min: e.target.value }))}
/>
```

**Problem:**
- Can enter negative numbers
- Can enter non-numeric values
- No min/max validation

**Expected Behavior:**
```javascript
// ✅ VALIDATE NUMBERS
import { validateNumeric } from '@/utils/validation';
const priceError = formData.price_min && !validateNumeric(formData.price_min, { min: 0 })
  ? 'Price must be a positive number'
  : '';
```

**Priority:** 🟡 **High**

---

### B2.7 — Missing URL Validation ❌

**Files Affected:**
- `src/pages/dashboard/company-info.jsx` - Website field
- `src/pages/onboarding.jsx` - Website field

**Current Pattern:**
```javascript
// ❌ NO URL VALIDATION
<Input
  type="url"
  value={formData.website}
  placeholder="https://yourcompany.com"
/>
```

**Problem:**
- Only HTML5 validation
- No client-side validation
- Invalid URLs can be saved

**Expected Behavior:**
```javascript
// ✅ VALIDATE URL
import { isValidUrl } from '@/utils/validation';
const urlError = formData.website && !isValidUrl(formData.website)
  ? 'Please enter a valid URL'
  : '';
```

**Priority:** 🟢 **Medium**

---

### B2.8 — Missing Error State Display ❌

**Files Affected:**
- All form pages - No field-level error display

**Current Pattern:**
```javascript
// ❌ NO ERROR DISPLAY
<Input
  value={formData.email}
  // No error message shown
/>
```

**Problem:**
- Errors only shown in toasts
- No visual indicators on invalid fields
- Users don't know which fields have errors

**Expected Behavior:**
```javascript
// ✅ SHOW FIELD ERRORS
<Input
  value={formData.email}
  error={errors.email}
  className={errors.email ? 'border-red-500' : ''}
/>
{errors.email && (
  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
)}
```

**Priority:** 🟡 **High**

---

## 3. B3.x — PAGINATION & PERFORMANCE ISSUES (10 Issues)

### B3.1 — No Pagination on Orders List ❌

**File:** `src/pages/dashboard/orders.jsx` (Line 128)

**Current Pattern:**
```javascript
// ❌ HARDCODED LIMIT
const { data: allOrders } = await supabase
  .from('orders')
  .select('*, products(*)')
  .order('created_at', { ascending: false })
  .limit(100);  // Hardcoded, no pagination UI
```

**Problem:**
- Loads 100 orders at once
- No "Load More" button
- Performance degrades with many orders

**Priority:** 🔴 **Critical**

---

### B3.2 — No Pagination on RFQs List ❌

**File:** `src/pages/dashboard/rfqs.jsx` (Lines 75, 92, 107)

**Current Pattern:**
```javascript
// ❌ MULTIPLE HARDCODED LIMITS
.limit(100);  // Line 75
.limit(100);  // Line 92
.limit(100);  // Line 107
```

**Problem:**
- Same issue as orders
- No pagination UI
- Loads all RFQs at once

**Priority:** 🔴 **Critical**

---

### B3.3 — No Pagination on Products List ❌

**File:** `src/pages/dashboard/products.jsx`

**Current Pattern:**
```javascript
// ❌ NO LIMIT AT ALL
const { data: myProducts } = await productsQuery
  .order('created_at', { ascending: false });
// Could load thousands of products
```

**Problem:**
- No limit on query
- Could load all products
- Memory and performance issues

**Priority:** 🔴 **Critical**

---

### B3.4 — No Pagination on Marketplace ❌

**File:** `src/pages/marketplace.jsx` (Line 56)

**Current Pattern:**
```javascript
// ❌ HARDCODED LIMIT
.limit(100);
```

**Problem:**
- Public marketplace loads 100 products
- No pagination
- Users can't see more products

**Priority:** 🔴 **Critical**

---

### B3.5 — N+1 Query in RFQ Quotes Count ❌

**File:** `src/pages/rfqmanagement.jsx` (Lines 68-77)

**Current Pattern:**
```javascript
// ❌ N+1 QUERIES
const rfqsWithQuotes = await Promise.all(
  (data || []).map(async (rfq) => {
    const { count } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .eq('rfq_id', rfq.id);
    return { ...rfq, quotesCount: count || 0 };
  })
);
```

**Problem:**
- One query per RFQ
- For 50 RFQs = 51 queries
- Should use aggregation

**Priority:** 🔴 **Critical**

---

### B3.6 — Fetching All Categories at Once ❌

**Files Affected:**
- `src/pages/dashboard/products.jsx` (Line 64)
- `src/pages/products.jsx` (Line 45)
- `src/pages/rfq-marketplace.jsx` (Line 40)

**Current Pattern:**
```javascript
// ❌ NO LIMIT
const { data: categoriesData } = await supabase
  .from('categories')
  .select('*')
  .order('name');
```

**Problem:**
- Loads all categories
- Usually fine, but could be many
- Should cache or limit

**Priority:** 🟢 **Medium**

---

### B3.7 — Fetching All Companies at Once ❌

**File:** `src/pages/orders.jsx` (Line 32)

**Current Pattern:**
```javascript
// ❌ NO LIMIT
const { data: companiesRes } = await supabase
  .from('companies')
  .select('*');
```

**Problem:**
- Loads all companies
- Could be thousands
- Should use pagination or filtering

**Priority:** 🟡 **High**

---

### B3.8 — No Query Optimization ❌

**Files Affected:**
- Multiple dashboard pages

**Current Pattern:**
```javascript
// ❌ FETCHING ALL FIELDS
.select('*')  // Fetches all columns
```

**Problem:**
- Fetches unnecessary data
- Increases payload size
- Slower queries

**Expected Behavior:**
```javascript
// ✅ SELECT ONLY NEEDED FIELDS
.select('id, title, status, created_at')
```

**Priority:** 🟡 **High**

---

### B3.9 — Missing Database Indexes (Assumed) ❌

**Issue:** No visible index optimization in queries

**Problem:**
- Queries may be slow on large datasets
- No visible use of indexes
- Should verify indexes exist for common filters

**Priority:** 🟢 **Medium**

---

### B3.10 — No Caching Strategy ❌

**Files Affected:**
- All dashboard pages

**Current Pattern:**
```javascript
// ❌ NO CACHING
useEffect(() => {
  loadData();  // Always fetches fresh data
}, []);
```

**Problem:**
- Fetches data on every mount
- No caching of static data (categories, etc.)
- Unnecessary API calls

**Expected Behavior:**
```javascript
// ✅ USE CACHING
import { useCachedData } from '@/hooks/useCachedData';
const categories = useCachedData('categories', loadCategories, { ttl: 3600 });
```

**Priority:** 🟢 **Medium**

---

## 4. B4.x — STATUS MAPPING ISSUES (8 Issues)

### B4.1 — Inconsistent Status Colors ❌

**Files Affected:**
- `src/components/ui/data-table.jsx` (Lines 51-60) - Uses generic colors
- `src/components/ui/badge.jsx` (Lines 9-15) - Uses generic colors
- Multiple pages use different color schemes

**Current Pattern:**
```javascript
// ❌ INCONSISTENT COLORS
success: 'bg-green-100 text-green-700 border-green-200',  // badge.jsx
warning: 'bg-yellow-100 text-yellow-700 border-yellow-200',
info: 'bg-blue-100 text-blue-700 border-blue-200',
danger: 'bg-red-100 text-red-700 border-red-200',
```

**Problem:**
- Uses generic colors instead of Afrikoni palette
- Inconsistent across components
- Not brand-aligned

**Expected Behavior:**
```javascript
// ✅ USE AFRIKONI COLORS
import { getStatusColors } from '@/constants/status';
const colors = getStatusColors(status);  // Returns Afrikoni colors
```

**Priority:** 🔴 **Critical**

---

### B4.2 — No Central Status Constants ❌

**Files Affected:**
- All dashboard pages

**Current Pattern:**
```javascript
// ❌ STATUS VALUES HARDCODED EVERYWHERE
if (status === 'pending') { ... }
if (status === 'processing') { ... }
if (status === 'shipped') { ... }
```

**Problem:**
- No central definition
- Typos cause bugs
- Hard to maintain

**Expected Behavior:**
```javascript
// ✅ USE CONSTANTS
import { ORDER_STATUS } from '@/constants/status';
if (status === ORDER_STATUS.PENDING) { ... }
```

**Priority:** 🔴 **Critical**

---

### B4.3 — Inconsistent Status Labels ❌

**Files Affected:**
- `src/pages/dashboard/shipments/[id].jsx` (Lines 119-126)
- `src/components/ui/data-table.jsx` (Lines 51-60)
- Multiple pages

**Current Pattern:**
```javascript
// ❌ DUPLICATED LABELS
const statusLabels = {
  pending_pickup: 'Pickup Scheduled',  // shipments/[id].jsx
  picked_up: 'Picked Up',
};

const statusMap = {
  pending: { label: 'Pending', variant: 'warning' },  // data-table.jsx
};
```

**Problem:**
- Labels defined in multiple places
- Inconsistent capitalization
- No single source of truth

**Expected Behavior:**
```javascript
// ✅ USE STATUS HELPER
import { getStatusLabel } from '@/constants/status';
const label = getStatusLabel(status);
```

**Priority:** 🟡 **High**

---

### B4.4 — Missing Status Icons ❌

**Files Affected:**
- `src/pages/dashboard/orders/[id].jsx` (Timeline)
- `src/pages/dashboard/shipments/[id].jsx` (Timeline)

**Current Pattern:**
```javascript
// ❌ HARDCODED ICONS
icon: ShoppingCart,  // orders/[id].jsx
icon: Truck,        // shipments/[id].jsx
```

**Problem:**
- Icons not mapped to statuses
- Inconsistent icon usage
- No central icon mapping

**Expected Behavior:**
```javascript
// ✅ USE STATUS ICON HELPER
import { getStatusIcon } from '@/constants/status';
const Icon = getStatusIcon(status);
```

**Priority:** 🟢 **Medium**

---

### B4.5 — Status Variant Inconsistencies ❌

**File:** `src/components/ui/data-table.jsx` (Lines 51-60)

**Current Pattern:**
```javascript
// ❌ INCONSISTENT VARIANTS
pending: { label: 'Pending', variant: 'warning' },
processing: { label: 'Processing', variant: 'info' },
shipped: { label: 'Shipped', variant: 'info' },
delivered: { label: 'Delivered', variant: 'success' },
```

**Problem:**
- `processing` and `shipped` both use `'info'`
- No clear distinction
- Should have unique variants

**Expected Behavior:**
```javascript
// ✅ UNIQUE VARIANTS
import { getStatusVariant } from '@/constants/status';
const variant = getStatusVariant(status);
```

**Priority:** 🟡 **High**

---

### B4.6 — Missing Status for Some Entities ❌

**Files Affected:**
- `src/pages/dashboard/products.jsx` - Product statuses
- `src/pages/dashboard/rfqs.jsx` - RFQ statuses

**Current Pattern:**
```javascript
// ❌ NO STATUS MAPPING
// Products: 'active', 'draft', 'paused'
// RFQs: 'open', 'pending', 'closed', 'awarded'
// Not in StatusChip component
```

**Problem:**
- Some statuses not mapped
- Inconsistent status handling
- Missing from status constants

**Priority:** 🟡 **High**

---

### B4.7 — Status Badge Component Limited ❌

**File:** `src/components/ui/data-table.jsx` (Lines 50-69)

**Current Pattern:**
```javascript
// ❌ LIMITED STATUS MAP
const statusMap = {
  pending: { label: 'Pending', variant: 'warning' },
  processing: { label: 'Processing', variant: 'info' },
  // Only 8 statuses defined
};
```

**Problem:**
- Only handles 8 statuses
- Missing many status types
- Doesn't handle custom statuses well

**Expected Behavior:**
```javascript
// ✅ COMPREHENSIVE STATUS SYSTEM
import { StatusChip } from '@/components/ui/StatusChip';
<StatusChip status={order.status} type="order" />
```

**Priority:** 🟡 **High**

---

### B4.8 — No Status Transition Validation ❌

**Files Affected:**
- `src/pages/dashboard/orders/[id].jsx`
- `src/pages/dashboard/shipments/[id].jsx`

**Current Pattern:**
```javascript
// ❌ NO VALIDATION
<Button onClick={() => handleStatusUpdate('shipped')}>
  Mark as Shipped
</Button>
// Could transition from any status to 'shipped'
```

**Problem:**
- No validation of valid transitions
- Users could skip statuses
- No business rules

**Expected Behavior:**
```javascript
// ✅ VALIDATE TRANSITIONS
import { canTransitionTo } from '@/constants/status';
if (canTransitionTo(currentStatus, newStatus)) {
  handleStatusUpdate(newStatus);
}
```

**Priority:** 🟡 **High**

---

## 5. B5.x — LOADING STATE ISSUES (7 Issues)

### B5.1 — Missing Loading Skeletons ❌

**Files Affected:**
- `src/pages/dashboard/orders.jsx` (Line 181) - Only spinner
- `src/pages/dashboard/products.jsx` - Only spinner
- `src/pages/dashboard/rfqs.jsx` - Only spinner

**Current Pattern:**
```javascript
// ❌ ONLY SPINNER
if (isLoading) {
  return (
    <div className="flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-afrikoni-gold" />
    </div>
  );
}
```

**Problem:**
- Blank white screen with spinner
- No content preview
- Poor UX

**Expected Behavior:**
```javascript
// ✅ USE SKELETONS
import { TableSkeleton } from '@/components/ui/skeletons';
if (isLoading) {
  return <TableSkeleton rows={5} />;
}
```

**Priority:** 🟡 **High**

---

### B5.2 — Inconsistent Loading Patterns ❌

**Files Affected:**
- All dashboard pages

**Current Pattern:**
```javascript
// ❌ INCONSISTENT PATTERNS
// Some use spinner
// Some use "Loading..." text
// Some use skeletons (if any)
```

**Problem:**
- No standard loading pattern
- Inconsistent UX
- Some pages have no loading state

**Expected Behavior:**
```javascript
// ✅ STANDARD PATTERN
import { PageLoader } from '@/components/ui/PageLoader';
if (isLoading) return <PageLoader />;
```

**Priority:** 🟡 **High**

---

### B5.3 — No Partial Loading States ❌

**Files Affected:**
- `src/pages/dashboard/DashboardHome.jsx` - Loads all data at once

**Current Pattern:**
```javascript
// ❌ ALL OR NOTHING
await Promise.allSettled([
  loadStats(),
  loadActivities(),
  loadTasks(),
  // ... all at once
]);
// Shows loading until ALL complete
```

**Problem:**
- Shows loading until all data loads
- Could show partial data as it loads
- Better UX with progressive loading

**Expected Behavior:**
```javascript
// ✅ PROGRESSIVE LOADING
const [statsLoading, setStatsLoading] = useState(true);
const [activitiesLoading, setActivitiesLoading] = useState(true);
// Show each section as it loads
```

**Priority:** 🟢 **Medium**

---

### B5.4 — Blank White Flashes ❌

**Files Affected:**
- All pages during initial load

**Current Pattern:**
```javascript
// ❌ BLANK SCREEN
// Component mounts → Blank → Data loads → Content shows
```

**Problem:**
- White flash before content
- Poor perceived performance
- Should show skeleton immediately

**Expected Behavior:**
```javascript
// ✅ IMMEDIATE SKELETON
// Component mounts → Skeleton → Content shows
```

**Priority:** 🟡 **High**

---

### B5.5 — No Loading State for Actions ❌

**Files Affected:**
- `src/pages/dashboard/orders/[id].jsx` - Status updates
- `src/pages/dashboard/shipments/[id].jsx` - Status updates

**Current Pattern:**
```javascript
// ❌ NO LOADING INDICATOR
<Button onClick={handleStatusUpdate}>
  Update Status
</Button>
// Button doesn't show loading state
```

**Problem:**
- Users don't know action is processing
- Could click multiple times
- No feedback

**Expected Behavior:**
```javascript
// ✅ SHOW LOADING
<Button onClick={handleStatusUpdate} disabled={isUpdating}>
  {isUpdating ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Updating...
    </>
  ) : (
    'Update Status'
  )}
</Button>
```

**Priority:** 🟡 **High**

---

### B5.6 — Missing Error States ❌

**Files Affected:**
- All dashboard pages

**Current Pattern:**
```javascript
// ❌ NO ERROR STATE
catch (error) {
  toast.error('Failed to load data');
  // No error UI shown
}
```

**Problem:**
- Errors only in toasts
- No error UI component
- Users don't know what went wrong

**Expected Behavior:**
```javascript
// ✅ SHOW ERROR STATE
if (error) {
  return <ErrorState message="Failed to load orders" onRetry={loadData} />;
}
```

**Priority:** 🟡 **High**

---

### B5.7 — No Optimistic Updates ❌

**Files Affected:**
- `src/pages/dashboard/orders/[id].jsx` - Status updates
- `src/pages/dashboard/shipments/[id].jsx` - Status updates

**Current Pattern:**
```javascript
// ❌ WAIT FOR SERVER
const handleStatusUpdate = async (newStatus) => {
  setIsUpdating(true);
  await supabase.from('orders').update({ status: newStatus });
  await loadOrderData();  // Reload all data
  setIsUpdating(false);
};
```

**Problem:**
- UI doesn't update until server responds
- Slow perceived performance
- Reloads all data unnecessarily

**Expected Behavior:**
```javascript
// ✅ OPTIMISTIC UPDATE
const handleStatusUpdate = async (newStatus) => {
  // Update UI immediately
  setOrder(prev => ({ ...prev, status: newStatus }));
  // Then sync with server
  await supabase.from('orders').update({ status: newStatus });
};
```

**Priority:** 🟢 **Medium**

---

## 📊 SUMMARY BY PRIORITY

### 🔴 Critical Issues (18)
1. B1.1 — Fragile string-based status filtering
2. B1.2 — Duplicated company/profile fetching
3. B1.3 — RFQ status logic inconsistencies
4. B1.4 — Order status logic inconsistencies
5. B1.7 — N+1 query pattern in RFQ quotes
6. B1.8 — Missing pagination on large lists
7. B2.5 — No input sanitization in some forms
8. B3.1 — No pagination on orders list
9. B3.2 — No pagination on RFQs list
10. B3.3 — No pagination on products list
11. B3.4 — No pagination on marketplace
12. B3.5 — N+1 query in RFQ quotes count
13. B4.1 — Inconsistent status colors
14. B4.2 — No central status constants

### 🟡 High Priority Issues (18)
1. B1.5 — Hybrid role logic duplicated
2. B1.6 — Scattered status label mappings
3. B1.9 — Inconsistent query patterns
4. B1.10 — Missing error states in forms
5. B1.11 — Status transition logic missing
6. B2.1 — Missing email validation
7. B2.2 — Missing phone number validation
8. B2.3 — Weak product form validation
9. B2.6 — Missing numeric validation
10. B2.8 — Missing error state display
11. B3.7 — Fetching all companies at once
12. B3.8 — No query optimization
13. B4.3 — Inconsistent status labels
14. B4.5 — Status variant inconsistencies
15. B4.6 — Missing status for some entities
16. B4.7 — Status badge component limited
17. B4.8 — No status transition validation
18. B5.1 — Missing loading skeletons

### 🟢 Medium Priority Issues (9)
1. B1.12 — Duplicated timeline building logic
2. B2.4 — Missing required field indicators
3. B2.7 — Missing URL validation
4. B3.6 — Fetching all categories at once
5. B3.9 — Missing database indexes (assumed)
6. B3.10 — No caching strategy
7. B4.4 — Missing status icons
8. B5.3 — No partial loading states
9. B5.7 — No optimistic updates

---

## 📁 FILES REQUIRING CHANGES

### **New Files to Create:**
1. `src/utils/validation.js` - Centralized validation functions
2. `src/constants/status.js` - Status constants and helpers
3. `src/utils/pagination.js` - Pagination utilities
4. `src/utils/queryBuilders.js` - Query builder helpers
5. `src/utils/timeline.js` - Timeline building helpers
6. `src/components/ui/skeletons.jsx` - Loading skeleton components
7. `src/components/ui/ErrorState.jsx` - Error state component

### **Files to Modify:**
1. `src/pages/dashboard/orders.jsx`
2. `src/pages/dashboard/orders/[id].jsx`
3. `src/pages/dashboard/rfqs.jsx`
4. `src/pages/dashboard/rfqs/[id].jsx`
5. `src/pages/dashboard/products.jsx`
6. `src/pages/dashboard/products/new.jsx`
7. `src/pages/dashboard/shipments.jsx`
8. `src/pages/dashboard/shipments/[id].jsx`
9. `src/pages/dashboard/company-info.jsx`
10. `src/pages/dashboard/products.jsx`
11. `src/pages/products.jsx`
12. `src/pages/marketplace.jsx`
13. `src/pages/rfq-marketplace.jsx`
14. `src/pages/rfqmanagement.jsx`
15. `src/pages/orders.jsx`
16. `src/pages/createrfq.jsx`
17. `src/pages/onboarding.jsx`
18. `src/components/ui/data-table.jsx`
19. `src/components/ui/badge.jsx`

**Total:** 26 files to create/modify

---

## ✅ NEXT STEPS

**Step 2 will:**
1. Create DIFFS for new helper files
2. Create DIFFS for status constants
3. Create DIFFS for validation utilities
4. Create DIFFS for pagination utilities
5. Create DIFFS for page updates
6. Show all changes before implementation

**Estimated Files to Modify:** 26 files  
**Estimated Changes:** 500+ individual fixes

---

**END OF AUDIT REPORT**

**Status:** ✅ **READY FOR PROPOSAL & DIFFS**

**Awaiting approval to proceed with Step 2 (Proposal & DIFFS).**

