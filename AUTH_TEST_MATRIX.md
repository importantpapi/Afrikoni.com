# 🔐 Auth Control Panel - Test Matrix

This document provides a comprehensive testing checklist to verify auth functionality across all scenarios.

## 🎛️ 4 Layers of Control

### 1️⃣ Frontend: Auth Debug Panel (Dev Only)

**Location:** Fixed bottom-right corner (dev mode only)

**What it shows:**
- `loggedIn`: Boolean - Session exists
- `userId`: First 8 chars of user ID
- `email`: User email address
- `expiresAt`: Session expiration time
- `lastEvent`: Last auth state change event

**How to use:**
1. Open app in development mode
2. Auth debug panel appears automatically
3. Watch values update in real-time during:
   - Signup
   - Login
   - Logout
   - Session refresh
   - OAuth flows

**What to verify:**
- ✅ Panel appears in dev mode
- ✅ Panel does NOT appear in production
- ✅ Values update immediately on auth events
- ✅ Console logs show `[AUTH EVENT]` messages

---

### 2️⃣ Route-level Protection: ProtectedRoute

**Location:** `src/components/ProtectedRoute.jsx`

**What it does:**
- Checks for valid session before rendering protected content
- Redirects to `/login` if no session
- Shows loading state during check
- Supports admin-only routes

**How to test:**
1. Visit `/dashboard` while logged out
2. Should redirect to `/login?next=/dashboard`
3. Login successfully
4. Should redirect back to `/dashboard`

**What to verify:**
- ✅ Protected routes redirect when logged out
- ✅ Loading state shows during check
- ✅ Redirect preserves destination (`next` param)
- ✅ Session check is immediate (no delays)

---

### 3️⃣ Supabase Dashboard: Server-side Truth

**Location:** Supabase Dashboard → Authentication → Logs

**Events to watch:**
- `user_signed_up` - New user registration
- `user_signed_in` - User login
- `token_refreshed` - Session refresh
- `user_signed_out` - User logout
- `password_recovery` - Password reset

**What to verify:**
- ✅ Signup → `user_signed_up` appears immediately
- ✅ Login → `user_signed_in` appears immediately
- ✅ OAuth → Callback completes successfully
- ✅ No repeated failures or retries
- ✅ Token refresh happens automatically

**If it's in Supabase logs → Auth worked. Frontend issues are just UX.**

---

### 4️⃣ Test Matrix: Complete Checklist

Run this checklist once and you're done. ✅ = Pass | ❌ = Fail

#### 🔹 Email / Password Auth

| Test | Expected Result | Status |
|------|----------------|--------|
| New email signup | Redirected to dashboard | ⬜ |
| Duplicate email signup | Inline error: "An account with this email already exists" | ⬜ |
| Wrong password login | Error message shown | ⬜ |
| Correct password login | Redirected to dashboard | ⬜ |
| Refresh page while logged in | Still logged in (session persists) | ⬜ |
| Logout | Redirected to login page | ⬜ |
| Session expiration | Auto-refresh or redirect to login | ⬜ |

#### 🔹 OAuth (Google)

| Test | Expected Result | Status |
|------|----------------|--------|
| New Google user | Account created + redirected | ⬜ |
| Existing Google user | Logged in + redirected | ⬜ |
| OAuth in incognito | Works (no cached session issues) | ⬜ |
| Refresh after OAuth | Session persists | ⬜ |
| OAuth callback error | Friendly error message | ⬜ |

#### 🔹 OAuth (Facebook)

| Test | Expected Result | Status |
|------|----------------|--------|
| New Facebook user | Account created + redirected | ⬜ |
| Existing Facebook user | Logged in + redirected | ⬜ |
| OAuth in incognito | Works (no cached session issues) | ⬜ |
| Refresh after OAuth | Session persists | ⬜ |

#### 🔹 Edge Cases

| Test | Expected Result | Status |
|------|----------------|--------|
| Open 2 tabs → sign out in one | Other tab reacts (shows logged out) | ⬜ |
| Slow network → signup | No blank page, shows loading state | ⬜ |
| Hard refresh on dashboard | Stays logged in | ⬜ |
| Browser back button after logout | Doesn't show protected content | ⬜ |
| Direct URL to protected route (logged out) | Redirects to login | ⬜ |
| Direct URL to protected route (logged in) | Shows content | ⬜ |
| Network error during signup | Shows friendly error message | ⬜ |
| Network error during login | Shows friendly error message | ⬜ |

#### 🔹 Session Management

| Test | Expected Result | Status |
|------|----------------|--------|
| Idle for 1 hour | Session still valid (auto-refresh) | ⬜ |
| Close browser → reopen | Still logged in (if remember me enabled) | ⬜ |
| Clear cookies → reopen | Logged out (session cleared) | ⬜ |
| Multiple devices | Each device has independent session | ⬜ |

---

## 🚨 Common Issues & Solutions

### Issue: "Nothing happens" after signup/login

**Check:**
1. Auth Debug panel - Is `loggedIn: true`?
2. Supabase logs - Is `user_signed_in` event present?
3. Browser console - Any errors?

**Solution:**
- If Supabase shows success → Session wait logic issue
- If Supabase shows error → Auth configuration issue
- If no Supabase event → Network/connectivity issue

### Issue: Redirect loops

**Check:**
1. ProtectedRoute - Is it checking session correctly?
2. PostLoginRouter - Is it redirecting correctly?
3. Auth Debug panel - Session state changing rapidly?

**Solution:**
- Verify session check happens before redirect
- Check for conflicting redirect logic
- Ensure loading states prevent double-renders

### Issue: Session expires too quickly

**Check:**
1. Supabase Dashboard → Auth Settings → JWT expiry
2. Token refresh happening (check logs)
3. Auto-refresh logic working

**Solution:**
- Adjust JWT expiry in Supabase settings
- Verify `useSessionRefresh` hook is active
- Check token refresh logic

---

## ✅ Success Criteria

**Auth is certified when:**

1. ✅ All Email/Password tests pass
2. ✅ All OAuth tests pass
3. ✅ All Edge Case tests pass
4. ✅ All Session Management tests pass
5. ✅ Supabase logs show clean events (no failures)
6. ✅ Auth Debug panel shows accurate state
7. ✅ No console errors during auth flows
8. ✅ No blank pages or "nothing happens" issues

---

## 📝 Notes

- **Test in multiple browsers:** Chrome, Firefox, Safari
- **Test on mobile:** iOS Safari, Chrome Mobile
- **Test in incognito:** Ensures no cached state issues
- **Test with slow network:** Throttle to 3G in DevTools
- **Test with Supabase paused:** Should show friendly error

---

## 🔒 Optional: Advanced Monitoring (Future)

When ready, consider:

1. **Sentry for auth routes:** Track auth errors in production
2. **Auth event logging table:** Log all auth events to Supabase table
3. **Admin "Active Sessions" page:** See all active user sessions
4. **Session analytics:** Track login frequency, device types, etc.

Not needed now, but useful for scaling.

