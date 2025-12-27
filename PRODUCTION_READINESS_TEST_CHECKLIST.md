# 🧪 Production Readiness Test Checklist

## ✅ Pre-Flight Code Verification

### Code Analysis Results:
- ✅ `AuthGate` has `authReady` guards
- ✅ `PostLoginRouter` waits for `authReady` before routing
- ✅ Deep URL pages (`/dashboard/orders/[id]`, `/dashboard/admin/users`) have `authReady` guards
- ✅ All migrated files use `SpinnerWithTimeout` (no infinite loading)
- ✅ Single `getSession()` call in `AuthProvider.resolveAuth()`

---

## 🧪 TEST 1: Cold Load Test

### Setup:
1. Open browser in **incognito/private mode**
2. Clear all cookies and cache
3. Open DevTools → Network tab
4. Filter by: `supabase`

### Test Cases:

#### Test 1A: Deep URL - Dashboard Detail Page
```
URL: /dashboard/orders/123
```

**Expected Flow:**
1. ✅ Spinner appears (`SpinnerWithTimeout`)
2. ✅ `getSession()` called **once** (visible in Network tab)
3. ✅ If no session → redirect to `/login`
4. ✅ If session exists → show correct dashboard page
5. ✅ No infinite loading (spinner disappears within timeout)
6. ✅ Profile fetched **once** after `getSession()`

**Check Network Tab:**
- ✅ Only **1** `auth/v1/token?grant_type=password` or `getSession()` call
- ✅ Only **1** `profiles` fetch after session resolved
- ✅ No repeated loops

#### Test 1B: Deep URL - Admin Page
```
URL: /dashboard/admin/users
```

**Expected Flow:**
1. ✅ Spinner appears
2. ✅ `getSession()` called **once**
3. ✅ If no session → redirect to `/login`
4. ✅ If session exists but not admin → show access denied
5. ✅ If admin → show admin page
6. ✅ No infinite loading

**Check Network Tab:**
- ✅ Only **1** auth call
- ✅ Only **1** profile fetch
- ✅ No loops

---

## 🧪 TEST 2: Role Switch Test

### Setup:
1. Log in as hybrid user (or any user with role switching)
2. Open DevTools → Network tab
3. Filter by: `supabase`

### Test Case:

#### Test 2A: Role Switching Flow
1. Navigate to role selection page (or use `RoleSelection` component)
2. Change role (e.g., buyer → seller)
3. Submit role change
4. **Refresh page** (F5 or Cmd+R)

**Expected Flow:**
1. ✅ Role updated in database
2. ✅ After refresh: Correct dashboard for new role appears
3. ✅ No stale data (old role's data not shown)
4. ✅ No double fetch (only 1 session + 1 profile call)
5. ✅ AuthProvider refreshes profile automatically (via `onAuthStateChange`)

**Check Network Tab:**
- ✅ Only **1** `getSession()` on page load
- ✅ Only **1** profile fetch after session resolved
- ✅ Profile update visible in response (new role value)
- ✅ No duplicate auth calls

**Note:** If `RoleSelection` doesn't trigger auth refresh automatically, you may need to:
- Call `refreshProfile()` from AuthProvider context after role update
- Or rely on `onAuthStateChange` listener (already in AuthProvider)

---

## 🧪 TEST 3: Network Tab Audit

### Setup:
1. Open DevTools → Network tab
2. Filter: `supabase`
3. Clear network log
4. Load any dashboard page

### Expected Results:

#### ✅ GOOD (Pass):
```
auth/v1/token?grant_type=password (or getSession) → 1 call
rest/v1/profiles?select=*&id=eq.{userId} → 1 call
```

#### ❌ BAD (Fail):
```
auth/v1/token → Multiple calls (loop detected)
rest/v1/profiles → Multiple calls (loop detected)
rest/v1/profiles → Multiple calls with same userId (redundant)
```

### Metrics to Check:

1. **Session Calls:**
   - ✅ Should be **1** per page load
   - ❌ Multiple calls = duplicate auth logic somewhere

2. **Profile Fetches:**
   - ✅ Should be **1** per page load (after session resolved)
   - ❌ Multiple fetches = missing `authReady` guard or race condition

3. **Query Patterns:**
   - ✅ All queries happen **after** session resolved
   - ❌ Queries before session = missing `authReady` guard

4. **Response Times:**
   - ✅ First paint: < 2 seconds
   - ✅ Full page load: < 5 seconds
   - ❌ Long waits = blocking auth calls or missing guards

---

## 🎯 Test Execution Steps

### Step 1: Cold Load Test
```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Open browser
# 1. Incognito mode
# 2. Go to: http://localhost:5173/dashboard/orders/123
# 3. Observe: Spinner → Login or Dashboard
# 4. Check Network tab for duplicate calls
```

### Step 2: Role Switch Test
```bash
# 1. Log in as hybrid user
# 2. Go to role selection
# 3. Switch role (buyer → seller)
# 4. Refresh page
# 5. Verify: Correct dashboard appears
# 6. Check Network tab: No duplicate calls
```

### Step 3: Network Audit
```bash
# 1. Open Network tab
# 2. Filter: supabase
# 3. Load any dashboard page
# 4. Count calls:
#    - getSession: Should be 1
#    - profiles fetch: Should be 1
#    - No loops detected
```

---

## 🔍 Known Issues & Fixes

### Issue 1: Role Switch Doesn't Refresh Auth
**Symptom:** After role switch, refresh still shows old role

**Fix:** Ensure `RoleSelection.jsx` calls `refreshProfile()` after update:
```javascript
const { refreshProfile } = useAuth();
// ... after updating profile
await refreshProfile();
```

### Issue 2: Infinite Loading
**Symptom:** Spinner never disappears

**Fix:** Already handled by `SpinnerWithTimeout` with 10s timeout

### Issue 3: Duplicate Auth Calls
**Symptom:** Multiple `getSession()` calls in Network tab

**Fix:** All components should use `useAuth()` hook (no direct `getSession()` calls)

---

## ✅ Success Criteria

### Test 1: Cold Load ✅
- [ ] Spinner appears and disappears within timeout
- [ ] Redirects to login if not authenticated
- [ ] Shows correct page if authenticated
- [ ] Only 1 `getSession()` call in Network tab

### Test 2: Role Switch ✅
- [ ] Role updates successfully
- [ ] Page refresh shows correct role
- [ ] No stale data
- [ ] Only 1 auth call on refresh

### Test 3: Network Audit ✅
- [ ] Only 1 `getSession()` per page load
- [ ] Only 1 profile fetch per page load
- [ ] No duplicate calls
- [ ] No fetch loops

---

## 🚨 If Tests Fail

### Debug Checklist:
1. ✅ Check console for `[AUTH PROVIDER]` logs
2. ✅ Check Network tab for duplicate calls
3. ✅ Verify component uses `useAuth()` hook
4. ✅ Verify `authReady` guards are in place
5. ✅ Check `useEffect` dependencies (should include `authReady`)

### Common Fixes:
- Add missing `authReady` guard in `useEffect`
- Remove duplicate `getSession()` calls
- Add `refreshProfile()` call after role update
- Check `useEffect` dependencies array

---

## 📊 Expected Performance

### Cold Load (First Visit):
- **Time to First Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Network Calls:** 2 (session + profile)

### Role Switch + Refresh:
- **Time to Update:** < 1s (role update)
- **Time to Refresh:** < 2s (page reload)
- **Network Calls:** 2 (session + profile on refresh)

---

## 🎯 Test Status

- [ ] Test 1A: Deep URL - Orders Detail ✅
- [ ] Test 1B: Deep URL - Admin Users ✅
- [ ] Test 2A: Role Switch + Refresh ✅
- [ ] Test 3: Network Audit ✅

**All tests passing?** → 🟢 **PRODUCTION READY**

---

## 📝 Notes

- Tests should be run in **incognito mode** to simulate cold load
- Use **Network tab** filtering to isolate Supabase calls
- Watch for console errors/warnings during tests
- If any test fails, check the "Known Issues & Fixes" section

**Last Updated:** $(date)

