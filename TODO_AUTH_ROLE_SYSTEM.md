# 🏗️ AFRIKONI — AUTH & ROLE SYSTEM
## Implementation TODO List

### 🔒 PHASE 0 — BASELINE FREEZE (READ-ONLY)
**Status:** ⏳ Pending  
**Objective:** Confirm app stability before changes

- [ ] Homepage renders correctly
- [ ] Guest can browse freely
- [ ] Search functionality works
- [ ] No redirects for guests
- [ ] `npm run dev` succeeds without errors

**⚠️ If anything fails → STOP and report**

---

### 🔧 PHASE 1 — AUTH PROVIDER (CRITICAL FOUNDATION)
**Status:** ⏳ Pending  
**Goal:** Eliminate AuthSessionMissingError noise and support guest-first auth

**Files to modify:**
- `src/contexts/AuthProvider.jsx` (or .tsx)

**Requirements:**
- [ ] `session === null` → guest mode (not an error)
- [ ] Missing session is NOT an error
- [ ] Auth errors never crash the app
- [ ] Profile fetch failure fails gracefully
- [ ] Clean console logs (info/warn/error only)
- [ ] App boots as guest if no session
- [ ] Authenticated users fetch profile
- [ ] If profile fetch fails → user still logged in, role = null
- [ ] On logout → return to guest state

**Verification:**
- [ ] No AuthSessionMissingError in console
- [ ] Guest browsing works
- [ ] Login/logout still function
- [ ] App never crashes on auth

**⛔ STOP AFTER THIS PHASE. DO NOT CONTINUE UNTIL VERIFIED.**

---

### 🧩 PHASE 2 — ROLE SYSTEM (ISOLATED)
**Status:** ⏳ Pending  
**Goal:** Create single source of truth for roles & permissions

**New file:**
- `src/utils/roles.js`

**Must include:**
- [ ] ROLES enum (buyer, seller, logistics, hybrid)
- [ ] Role validators
- [ ] Capability system
- [ ] Role-based navigation helpers
- [ ] Display helpers (labels, colors)

**Rules:**
- No UI usage yet
- No refactors
- No inline strings anywhere

**Verification:**
- [ ] File exports correctly
- [ ] No runtime errors
- [ ] Not yet wired into UI

**⛔ STOP AFTER THIS PHASE.**

---

### 🧭 PHASE 3 — NAVIGATION FIXES (TARGETED)
**Status:** ⏳ Pending  
**Goal:** Fix duplicate /login key warnings and clean role-based nav

**Files to modify:**
- `src/components/layout/MobileMainNav.jsx`
- `src/components/layout/MobileBottomNav.jsx`
- `src/components/mobile/MobileBottomNav.tsx`

**Requirements:**
- [ ] All nav items have stable unique keys
- [ ] Use `getRoleNavigation(role)`
- [ ] Guests see guest nav
- [ ] Auth users see role nav
- [ ] Login/signup appear only once

**Verification:**
- [ ] No React key warnings
- [ ] Guest nav intact
- [ ] Role nav correct
- [ ] No UI regressions

**⛔ STOP AFTER THIS PHASE.**

---

### 🛡 PHASE 4 — ERROR BOUNDARY (SAFETY NET)
**Status:** ⏳ Pending  
**Goal:** Prevent crashes from killing the whole app

**New file:**
- `src/components/ErrorBoundary.jsx`

**Update:**
- [ ] Wrap app in ErrorBoundary

**Rules:**
- [ ] Friendly fallback UI
- [ ] No redirects
- [ ] Log real errors only

**Verification:**
- [ ] App survives forced errors
- [ ] UI fallback renders
- [ ] No auth impact

---

### 🔇 PHASE 5 — DEV ERROR FILTERING (NOISE CONTROL)
**Status:** ⏳ Pending  
**Goal:** Silence browser extension & known non-issues in dev

**New file:**
- `src/utils/errorFilter.js`

**Apply ONLY in development:**
- [ ] Chrome extension errors
- [ ] Known auth noise
- [ ] Content script errors

**Rules:**
- [ ] Never hide real app errors
- [ ] Never run in production

**Verification:**
- [ ] Console is clean
- [ ] Real errors still visible

---

### ⏳ PHASE 6 — LOADING STATES (POLISH)
**Status:** ⏳ Pending  
**Goal:** Prevent flicker and undefined auth states

**Files:**
- `src/components/LoadingScreen.jsx`
- Update `App.jsx`

**Behavior:**
- [ ] Show loading only while auth initializes
- [ ] Guests skip loading quickly
- [ ] No blocking browse UX

---

### 📚 PHASE 7 — DOCUMENTATION (MANDATORY)
**Status:** ⏳ Pending  
**New file:**
- `docs/AUTH_SYSTEM.md`

**Must explain:**
- [ ] Guest-first philosophy
- [ ] Role system usage
- [ ] Common mistakes
- [ ] How new devs should extend it

---

## ✅ FINAL VERIFICATION (MANDATORY)

### Functional
- [ ] Guest can browse everything
- [ ] No auth errors in console
- [ ] Login → correct dashboard
- [ ] Logout → homepage
- [ ] Hybrid role works

### Code Quality
- [ ] No inline role strings
- [ ] No duplicate keys
- [ ] Error boundaries active
- [ ] Clean logs

### Stability
- [ ] Refresh safe
- [ ] No infinite loops
- [ ] No silent crashes

---

## 🚨 FAILURE RULE

If ANY phase breaks something:
1. STOP
2. Revert only that phase
3. Report findings
4. Fix before continuing

---

## 📋 Implementation Rules

### ❌ NEVER DO THESE
- DO NOT redirect guests away from public pages
- DO NOT treat "no session" as an error
- DO NOT modify Supabase schema
- DO NOT break or redesign UI
- DO NOT change API contracts
- DO NOT add dependencies
- DO NOT use inline role strings ('seller', 'buyer', etc.)
- DO NOT log sensitive user data
- DO NOT refactor unrelated files
- DO NOT implement multiple phases at once

### ✅ ALWAYS DO THESE
- ALWAYS support guest users (session === null is valid)
- ALWAYS fail open to guest mode on errors
- ALWAYS isolate changes to the current phase
- ALWAYS verify build & runtime after each phase
- ALWAYS leave comments explaining decisions
- ALWAYS keep code readable for junior devs

