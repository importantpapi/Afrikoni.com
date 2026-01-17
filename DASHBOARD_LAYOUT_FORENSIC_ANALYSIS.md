# 🔍 FORENSIC ANALYSIS: DashboardLayout.jsx - profileCompanyId Error

## ❌ CRITICAL ERROR IDENTIFIED

**Error**: `ReferenceError: profileCompanyId is not defined` at `DashboardLayout.jsx:255:69`

---

## 📊 CODE FLOW ANALYSIS

### Variable Declaration Order (CURRENT - BROKEN):

```javascript
Line 227: const { user: contextUser, profile: contextProfile, ... } = useUser();
Line 228-243: Various useState declarations
Line 244: // Comment
Line 246-252: mergedUser declaration
Line 254: // Comment
Line 255: ❌ const notificationCounts = useNotificationCounts(contextUser?.id, profileCompanyId);
         // ERROR: profileCompanyId is NOT DECLARED YET!
Line 275-280: useEffect that uses profileCompanyId (also not declared)
Line 282-286: contextUserId, contextUserEmail, contextProfileId declared
Line 288-318: useEffect that uses profileCompanyId (still not declared)
```

### Problem Locations:

1. **Line 255**: `useNotificationCounts(contextUser?.id, profileCompanyId)` - `profileCompanyId` undefined
2. **Line 276**: `if (profileCompanyId)` - `profileCompanyId` undefined  
3. **Line 280**: `}, [profileCompanyId])` - `profileCompanyId` undefined
4. **Line 314**: `companyId: profileCompanyId || 'null'` - `profileCompanyId` undefined
5. **Line 318**: `profileCompanyId,` in dependency array - `profileCompanyId` undefined

---

## ✅ ROOT CAUSE

**The variable `profileCompanyId` is NEVER DECLARED in the entire file.**

It's used 5 times but never defined. The code expects it to exist but it doesn't.

---

## 🔧 THE FIX

**Add this declaration RIGHT AFTER `contextProfile` is obtained:**

```javascript
Line 227: const { user: contextUser, profile: contextProfile, ... } = useUser();
Line 228: const profileCompanyId = contextProfile?.company_id || null; // ✅ ADD THIS
```

This must be added BEFORE line 255 where it's first used.

---

## 📋 COMPLETE FIX ORDER

1. ✅ Declare `profileCompanyId` immediately after `contextProfile` (line 228)
2. ✅ Ensure it's declared before `useNotificationCounts` (line 255)
3. ✅ Ensure it's declared before first `useEffect` (line 275)
4. ✅ Ensure it's declared before kernel logging `useEffect` (line 288)

---

## 🎯 IMPACT

**Current State**: Dashboard crashes on load with `ReferenceError`

**After Fix**: Dashboard loads correctly, `profileCompanyId` available throughout component

---

## ✅ VERIFICATION CHECKLIST

After fix, verify:
- [ ] `profileCompanyId` declared before line 255
- [ ] No `ReferenceError` in console
- [ ] Dashboard loads successfully
- [ ] Notification counts work correctly
- [ ] Kernel logging works correctly
