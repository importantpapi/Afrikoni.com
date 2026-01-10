# PHASE 5B — roleHelpers.js Cleanup — COMPLETE ✅

**Status:** Complete — All role-based functions marked as deprecated with capability-based alternatives

## 📋 SUMMARY

All functions in `src/utils/roleHelpers.js` have been marked as **DEPRECATED** with warnings pointing to capability-based alternatives. Functions remain functional for backward compatibility but will be removed in future cleanup phases.

## 🔄 CHANGES MADE

### 1. **Marked All Functions as Deprecated**

All functions now include:
- `@deprecated` JSDoc tag
- Console warnings in development mode
- Clear instructions to use `useCapability()` hook instead

### 2. **Updated Functions**

#### ✅ `getUserRole(profile)`
- **Status:** DEPRECATED
- **Alternative:** Use `useCapability()` hook from `CapabilityContext`
- **Still Works:** ✅ (backward compatibility)

#### ✅ `isBuyer(role, viewMode)`
- **Status:** DEPRECATED
- **Alternative:** Use `capabilities.can_buy === true`
- **Still Works:** ✅ (backward compatibility)

#### ✅ `isSeller(role, viewMode)`
- **Status:** DEPRECATED
- **Alternative:** Use `capabilities.can_sell === true && capabilities.sell_status === 'approved'`
- **Still Works:** ✅ (backward compatibility)

#### ✅ `isHybrid(role)`
- **Status:** DEPRECATED
- **Alternative:** Use `capabilities.can_buy === true && capabilities.can_sell === true && capabilities.sell_status === 'approved'`
- **Still Works:** ✅ (backward compatibility)

#### ✅ `isLogistics(role)`
- **Status:** DEPRECATED
- **Alternative:** Use `capabilities.can_logistics === true && capabilities.logistics_status === 'approved'`
- **Still Works:** ✅ (backward compatibility)

#### ✅ `canViewBuyerFeatures(role, viewMode)`
- **Status:** DEPRECATED
- **Alternative:** Use `capabilities.can_buy === true`
- **Still Works:** ✅ (backward compatibility)

#### ✅ `canViewSellerFeatures(role, viewMode)`
- **Status:** DEPRECATED
- **Alternative:** Use `capabilities.can_sell === true && capabilities.sell_status === 'approved'`
- **Still Works:** ✅ (backward compatibility)

#### ✅ `shouldLoadBuyerData(role, viewMode)`
- **Status:** DEPRECATED
- **Alternative:** Use `capabilities.can_buy === true`
- **Still Works:** ✅ (backward compatibility)

#### ✅ `shouldLoadSellerData(role, viewMode)`
- **Status:** DEPRECATED
- **Alternative:** Use `capabilities.can_sell === true && capabilities.sell_status === 'approved'`
- **Still Works:** ✅ (backward compatibility)

#### ✅ `getValidViewModes(role)`
- **Status:** DEPRECATED
- **Alternative:** View modes are no longer used - all users use `/dashboard`
- **Still Works:** ✅ (backward compatibility)

#### ✅ `getDashboardPathForRole(role)`
- **Status:** DEPRECATED & UPDATED
- **Change:** Always returns `/dashboard` (single route, not role-based)
- **Alternative:** Use `/dashboard` directly (capability-based, not role-based)
- **Still Works:** ✅ (but always returns `/dashboard`)

## 📁 FILES USING roleHelpers (For Reference)

### Dashboard Pages (Should Migrate to Capabilities)
- `src/pages/dashboard/analytics.jsx` - Uses `getUserRole`
- `src/pages/dashboard/orders.jsx` - Uses `getUserRole`, `isHybrid`, `canViewBuyerFeatures`, `canViewSellerFeatures`, `isLogistics`
- `src/pages/dashboard/rfqs.jsx` - Uses `getUserRole`, `canViewBuyerFeatures`, `canViewSellerFeatures`, `isHybrid`, `isLogistics`
- `src/pages/dashboard/products.jsx` - Uses `getUserRole`
- `src/pages/dashboard/team-members.jsx` - Uses `getUserRole`
- `src/pages/dashboard/supplier-rfqs.jsx` - Uses `getUserRole`, `canViewSellerFeatures`
- `src/pages/dashboard/orders/[id].jsx` - Uses `getUserRole`
- `src/pages/dashboard/rfqs/[id].jsx` - Uses `getUserRole`
- `src/pages/dashboard/products/new.jsx` - Uses `getUserRole`
- `src/pages/dashboard/shipments.jsx` - Uses `getUserRole`
- `src/pages/dashboard/shipments/[id].jsx` - Uses `getUserRole`

### Non-Dashboard Pages (Can Keep Using roleHelpers for Now)
- `src/pages/select-role.jsx` - Uses `getDashboardPathForRole` (now returns `/dashboard`)
- `src/pages/verification-center.jsx` - Uses `isSeller`, `isHybrid`
- `src/pages/logistics.jsx` - Uses `isLogistics`
- `src/components/layout/Navbar.jsx` - Uses `isSeller`
- `src/components/home/ServicesOverview.jsx` - Uses `isLogistics`
- `src/utils/authHelpers.js` - Uses `getUserRole`

## 🔄 MIGRATION GUIDE

### Before (Role-Based):
```js
import { getUserRole, isBuyer, canViewBuyerFeatures } from '@/utils/roleHelpers';

const role = getUserRole(profile);
const canBuy = isBuyer(role);
const canView = canViewBuyerFeatures(role);
```

### After (Capability-Based):
```js
import { useCapability } from '@/context/CapabilityContext';

const capabilities = useCapability();
const canBuy = capabilities.can_buy === true;
const canSell = capabilities.can_sell === true && capabilities.sell_status === 'approved';
const canLogistics = capabilities.can_logistics === true && capabilities.logistics_status === 'approved';
```

## ✅ VERIFICATION

### Deprecation Warnings
- ✅ All functions log warnings in development mode
- ✅ All functions include `@deprecated` JSDoc tags
- ✅ All functions point to capability-based alternatives

### Backward Compatibility
- ✅ All functions still work (for legacy code)
- ✅ No breaking changes introduced
- ✅ `getDashboardPathForRole` always returns `/dashboard` (safe fallback)

### No Linter Errors
- ✅ TypeScript: No errors
- ✅ ESLint: No errors
- ✅ All imports resolved

## 🎯 NEXT STEPS (Future Phases)

### Phase 6: Migrate Dashboard Pages
- Update `src/pages/dashboard/analytics.jsx` to use `useCapability()`
- Update `src/pages/dashboard/orders.jsx` to use `useCapability()`
- Update `src/pages/dashboard/rfqs.jsx` to use `useCapability()`
- Update all other dashboard pages to use capabilities

### Phase 7: Remove roleHelpers Functions
- After all dashboard pages are migrated, remove deprecated functions
- Keep only functions needed for non-dashboard pages (if any)
- Or create separate file for non-dashboard role helpers

### Phase 8: Final Cleanup
- Remove `roleHelpers.js` entirely (if no longer needed)
- Or keep minimal set for public pages only

## 🔒 SAFETY GUARANTEES

- ✅ **No Breaking Changes:** All functions still work
- ✅ **Backward Compatible:** Legacy code continues to function
- ✅ **Clear Migration Path:** Deprecation warnings guide migration
- ✅ **Safe Defaults:** `getDashboardPathForRole` always returns `/dashboard`

---

**Phase 5B roleHelpers Cleanup: COMPLETE ✅**

All role-based functions are now deprecated with clear capability-based alternatives. Functions remain functional for backward compatibility.
