# PHASE 5B — DashboardRoleContext Removal — COMPLETE ✅

**Status:** Complete — DashboardRoleContext removed and replaced with CapabilityContext

## 📋 SUMMARY

All role-based dashboard dependencies have been removed and replaced with capability-based access control using `CapabilityContext`.

### ✅ COMPLETED TASKS

1. **Removed DashboardRoleContext from DashboardLayout**
   - Removed `useDashboardRole()` hook usage
   - Replaced with `useCapability()` from `CapabilityContext`
   - Sidebar now built from capabilities, not roles

2. **Replaced RequireDashboardRole with RequireCapability**
   - 20+ dashboard pages updated
   - All role-based guards replaced with capability-based guards
   - Admin pages use route-level admin check (ProtectedRoute requireAdmin)

3. **Disabled DashboardRoleContext**
   - `DashboardRoleProvider` now returns children directly (disabled)
   - `useDashboardRole()` throws error to catch any remaining usages
   - File kept for reference but should not be used

4. **Fixed RequireCapability Logic**
   - Supports OR logic when multiple capabilities specified
   - Supports AND logic for single capability
   - Proper error messages for missing capabilities

## 📁 FILES CHANGED

### Modified Files (22+ files)

**Dashboard Pages (20 files):**
- `src/pages/dashboard/orders.jsx` - Buyer pages → `canBuy={true}`
- `src/pages/dashboard/rfqs.jsx` - Buyer pages → `canBuy={true}`
- `src/pages/dashboard/saved.jsx` - Buyer pages → `canBuy={true}`
- `src/pages/dashboard/products.jsx` - Seller pages → `canSell={true} requireApproved={true}`
- `src/pages/dashboard/sales.jsx` - Seller pages → `canSell={true} requireApproved={true}`
- `src/pages/dashboard/supplier-rfqs.jsx` - Seller pages → `canSell={true} requireApproved={true}`
- `src/pages/dashboard/supplier-analytics.jsx` - Seller pages → `canSell={true} requireApproved={true}`
- `src/pages/dashboard/subscriptions.jsx` - Seller pages → `canSell={true} requireApproved={true}`
- `src/pages/dashboard/performance.jsx` - Seller pages → `canSell={true} requireApproved={true}`
- `src/pages/dashboard/reviews.jsx` - Seller pages → `canSell={true} requireApproved={true}`
- `src/pages/dashboard/team-members.jsx` - Seller pages → `canSell={true} requireApproved={true}`
- `src/pages/dashboard/verification-marketplace.jsx` - Seller pages → `canSell={true} requireApproved={true}`
- `src/pages/dashboard/logistics-quote.jsx` - Logistics pages → `canLogistics={true} requireApproved={true}`
- `src/pages/dashboard/logistics-dashboard.jsx` - Logistics pages → `canLogistics={true} requireApproved={true}`
- `src/pages/dashboard/fulfillment.jsx` - Seller/Logistics OR → `canSell={true} canLogistics={true} requireApproved={true}`
- `src/pages/dashboard/returns.jsx` - Buyer/Seller OR → `canBuy={true} canSell={true}`
- `src/pages/dashboard/payments.jsx` - Buyer/Seller OR → `canBuy={true} canSell={true}`
- `src/pages/dashboard/analytics.jsx` - Buyer pages → `canBuy={true}`
- `src/pages/dashboard/protection.jsx` - Buyer pages → `canBuy={true}`
- `src/pages/dashboard/support-chat.jsx` - Universal → No require prop
- `src/pages/dashboard/help.jsx` - Universal + capability-based tabs → Uses capabilities for tab visibility

**Admin Pages (2 files):**
- `src/pages/dashboard/admin/reviews-moderation.jsx` - Removed RequireDashboardRole, uses route-level admin check
- `src/pages/dashboard/admin/trust-engine.jsx` - Removed RequireDashboardRole, uses route-level admin check

**Core Files (3 files):**
- `src/layouts/DashboardLayout.jsx` - Removed `useDashboardRole()`, uses `useCapability()` instead
- `src/guards/RequireCapability.tsx` - Enhanced with OR logic for multiple capabilities
- `src/context/DashboardRoleContext.tsx` - Disabled (returns children, throws error on use)

## 🔄 REPLACEMENT PATTERNS

### Before (Role-Based):
```jsx
import RequireDashboardRole from '@/guards/RequireDashboardRole';

<RequireDashboardRole allow={['buyer', 'hybrid']}>
  <BuyerPage />
</RequireDashboardRole>
```

### After (Capability-Based):
```jsx
import RequireCapability from '@/guards/RequireCapability';

<RequireCapability canBuy={true}>
  <BuyerPage />
</RequireCapability>
```

### Capability Mappings:
- `allow={['buyer', 'hybrid']}` → `canBuy={true}`
- `allow={['seller', 'hybrid']}` → `canSell={true} requireApproved={true}`
- `allow={['logistics']}` → `canLogistics={true} requireApproved={true}`
- `allow={['buyer', 'seller', 'hybrid', 'logistics']}` → No require prop (universal)
- `allow={['admin']}` → Removed (uses route-level `ProtectedRoute requireAdmin`)

## 🔒 REQUIRE CAPABILITY LOGIC

### Single Capability (AND Logic):
```jsx
<RequireCapability canSell={true} requireApproved={true}>
  <ProductsPage />
</RequireCapability>
```
- Requires: `can_sell === true AND sell_status === 'approved'`

### Multiple Capabilities (OR Logic):
```jsx
<RequireCapability canSell={true} canLogistics={true} requireApproved={true}>
  <FulfillmentPage />
</RequireCapability>
```
- Requires: `(can_sell === true AND sell_status === 'approved') OR (can_logistics === true AND logistics_status === 'approved')`

### Universal Pages:
```jsx
<RequireCapability>
  <SupportChatPage />
</RequireCapability>
```
- No capability check (allows all users with capabilities ready)

## 🚫 DISABLED FILES

### `src/context/DashboardRoleContext.tsx`
- **Status:** Disabled (not deleted for reference)
- **DashboardRoleProvider:** Returns children directly, logs warning
- **useDashboardRole:** Throws error to catch any remaining usages
- **Action:** Can be deleted in future cleanup phase

### `src/guards/RequireDashboardRole.tsx`
- **Status:** Still exists (can be deleted in future cleanup)
- **Usage:** None (all pages updated to use RequireCapability)
- **Action:** Can be deleted in future cleanup phase

## ✅ VERIFICATION

### No Linter Errors
- ✅ All modified files pass linting
- ✅ No TypeScript errors
- ✅ No ESLint errors

### Remaining References (Non-Critical)
- `src/pages/dashboard/architecture-viewer.jsx` - Documentation file only (mentions DashboardRoleContext in docs)
- No actual usage of `useDashboardRole` or `DashboardRoleProvider` in active code

### Expected Behavior
- ✅ App boots without "useDashboardRole must be used within a DashboardRoleProvider" errors
- ✅ Dashboard renders using capabilities from CapabilityContext
- ✅ All pages use RequireCapability guards
- ✅ Admin pages use route-level admin check
- ✅ Sidebar built from capabilities, not roles

## 🎯 NEXT STEPS (Future Phases)

1. **Delete Legacy Files** (Phase 8):
   - Delete `src/context/DashboardRoleContext.tsx`
   - Delete `src/guards/RequireDashboardRole.tsx`
   - Update documentation in `architecture-viewer.jsx`

2. **Clean Up Role Helpers** (Remaining Task):
   - Review `src/utils/roleHelpers.js`
   - Replace role-based functions with capability-based functions
   - Remove or update `getDashboardPathForRole`, `getUserRole`, etc.

3. **Admin Capability** (Future Enhancement):
   - Add `can_admin` field to `company_capabilities` table
   - Update RequireCapability to check admin capability
   - Remove route-level admin check in favor of capability check

---

**Phase 5B Complete ✅**

All role-based dashboard dependencies have been successfully removed and replaced with capability-based access control.
