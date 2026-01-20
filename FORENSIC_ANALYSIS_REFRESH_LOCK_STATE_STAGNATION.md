# FORENSIC ANALYSIS: REFRESH-LOCK & STATE STAGNATION
**Date:** 2024-02-07  
**Mode:** READ-ONLY ANALYSIS  
**Status:** 🔍 **DIAGNOSIS COMPLETE**

---

## EXECUTIVE SUMMARY

The application requires a hard refresh to display the Dashboard after login due to **multiple cascading race conditions** in the handshake sequence between AuthProvider, CapabilityContext (Kernel), and React Router. The root cause is a **"State Stagnation"** where React components fail to react to final state transitions because:

1. **CapabilityContext starts with `ready: true`** but may not trigger re-renders when it transitions from `true → false → true`
2. **PostLoginRouter has a 100ms delay** that may miss the final `ready: true` signal if it fires before the delay completes
3. **ProtectedRoute doesn't check `capabilities.ready`**, allowing navigation before Kernel is fully ready
4. **Login page has competing redirect logic** that may navigate before capabilities are loaded
5. **React Router's internal state cache** may not update until a hard refresh clears it

---

## SEQUENCE OF FAILURE TIMELINE

### Phase 1: User Clicks Sign In (T=0ms)

**Location:** `src/pages/login.jsx` line 73-122

**Flow:**
1. User submits login form
2. `authServiceLogin()` is called
3. **Immediate navigation** to `/auth/post-login` (line 97)
4. **Competing useEffect** (line 66-71) checks `ready && user` but may not fire if capabilities aren't ready yet

**Issue Identified:** 
- Login navigates to `/auth/post-login` **before** capabilities are loaded
- The competing redirect logic (line 66-71) may never fire if `ready` is still `false` when user navigates away

---

### Phase 2: Auth Resolves (T=100-500ms)

**Location:** `src/contexts/AuthProvider.jsx` line 129-195

**Flow:**
1. `resolveAuth()` is called
2. Session is retrieved from Supabase
3. Profile is fetched (line 167-171)
4. `authReady` is set to `true` (line 181)
5. `setUser(session.user)` and `setProfile(profileData)` are called (line 178-179)

**State at T=500ms:**
- ✅ `authReady: true`
- ✅ `user: { id: "...", email: "..." }`
- ✅ `profile: { id: "...", company_id: "..." }`
- ⚠️ `capabilities.ready: true` (initial state, but fetch hasn't started yet)

**Issue Identified:**
- AuthProvider sets `authReady: true` **immediately** after profile fetch
- However, `onAuthStateChange` listener (line 250-279) may fire `SIGNED_IN` event **after** `resolveAuth()` completes
- This creates a race condition where `silentRefresh()` may be called unnecessarily

---

### Phase 3: PostLoginRouter Mounts (T=500-600ms)

**Location:** `src/auth/PostLoginRouter.jsx` line 12-43

**Flow:**
1. Component mounts at `/auth/post-login`
2. `useEffect` starts with 100ms delay (line 26)
3. Checks: `authReady && user && capabilities?.ready` (line 27)

**State Check at T=600ms:**
- ✅ `authReady: true`
- ✅ `user: { ... }`
- ⚠️ `capabilities?.ready: true` (initial state, but fetch may not have started)

**Issue Identified:**
- PostLoginRouter checks `capabilities?.ready` but **CapabilityContext starts with `ready: true`** (line 78)
- The fetch effect (line 518) may not have started yet, so `ready` is still `true` from initial state
- Router navigates to `/dashboard` **before** capabilities are actually loaded
- The 100ms delay may cause the check to happen **before** the fetch effect runs

---

### Phase 4: CapabilityContext Fetch Attempts (T=600-2000ms)

**Location:** `src/context/CapabilityContext.tsx` line 518-578

**Flow:**
1. Fetch effect runs when `authReady && currentCompanyId` are true (line 522)
2. Checks `hasFetchedRef.current` - if false, calls `fetchCapabilities()` (line 533-534)
3. `fetchCapabilities()` sets `loading: true` but **keeps `ready: true`** (line 168)
4. Database query executes (line 204-208)
5. On success, sets `ready: true` again (line 367)

**State Transitions:**
- `ready: true` (initial) → `ready: true` (during fetch) → `ready: true` (after fetch)
- **No state change occurs** - React may not trigger re-renders!

**Issue Identified:**
- CapabilityContext **starts with `ready: true`** (line 78)
- During fetch, it **stays `ready: true`** (line 168)
- After fetch, it **stays `ready: true`** (line 367)
- **React doesn't detect a state change** because the value never changes!
- Components that depend on `capabilities.ready` may not re-render

---

### Phase 5: ProtectedRoute Checks (T=600-700ms)

**Location:** `src/components/ProtectedRoute.jsx` line 27-72

**Flow:**
1. ProtectedRoute checks `isPreWarming` (line 36)
2. Checks `authReady && loading` (line 41)
3. Checks `user` exists (line 46)
4. **Does NOT check `capabilities.ready`** ❌

**State Check:**
- ✅ `isPreWarming: false` (profile exists)
- ✅ `authReady: true`
- ✅ `user: { ... }`
- ⚠️ `capabilities.ready: true` (but not checked!)

**Issue Identified:**
- ProtectedRoute **does not check `capabilities.ready`**
- It only checks `authReady` and `isPreWarming`
- User is allowed through to Dashboard **even if capabilities aren't loaded**

---

### Phase 6: Dashboard Mounts (T=700-800ms)

**Location:** `src/pages/dashboard/WorkspaceDashboard.jsx` line 40-70

**Flow:**
1. WorkspaceDashboard mounts
2. Checks `isPreWarming` (line 64)
3. Checks `isSystemReady` (line 68)
4. `isSystemReady` requires `capabilities.ready === true` (useDashboardKernel.js line 44)

**State Check:**
- ✅ `isPreWarming: false`
- ⚠️ `isSystemReady: false` (if `capabilities.ready` is still initial `true` but fetch hasn't completed)
- Shows spinner: "Initializing Workspace..."

**Issue Identified:**
- `isSystemReady` checks `capabilities.ready === true` (line 44)
- But `capabilities.ready` is **always `true`** from initial state
- The check may pass **before** capabilities are actually loaded
- Dashboard may render with stale/default capabilities

---

### Phase 7: RequireCapability Guard (T=800-900ms)

**Location:** `src/components/auth/RequireCapability.jsx` line 50-169

**Flow:**
1. RequireCapability checks `capability?.ready` (line 134)
2. If `ready === false`, shows spinner
3. But `ready` is **always `true`** from initial state!

**State Check:**
- ✅ `capability?.ready: true` (initial state)
- ✅ Component renders children
- ⚠️ But capabilities may not be loaded yet!

**Issue Identified:**
- RequireCapability checks `capability?.ready` but it's **always `true`**
- The guard passes **immediately** even if capabilities aren't loaded
- Dashboard pages may render with default capabilities

---

## THE GAP: WHERE STATE STOPS FLOWING

### Critical Issue #1: CapabilityContext `ready` State Never Changes

**Location:** `src/context/CapabilityContext.tsx` line 70-80, 168, 367

**Problem:**
- CapabilityContext **starts with `ready: true`** (line 78)
- During fetch, it **stays `ready: true`** (line 168)
- After fetch, it **stays `ready: true`** (line 367)
- **React doesn't detect a state change** because the value never transitions

**Impact:**
- Components that depend on `capabilities.ready` may not re-render when capabilities are loaded
- `useEffect` hooks with `capabilities.ready` in dependencies may not fire
- PostLoginRouter may navigate before capabilities are actually loaded

**Evidence:**
```typescript
// Initial state (line 70-80)
ready: true  // ✅ Starts true

// During fetch (line 168)
ready: true  // ✅ Stays true

// After fetch (line 367)
ready: true  // ✅ Stays true

// NO STATE CHANGE DETECTED BY REACT!
```

---

### Critical Issue #2: PostLoginRouter 100ms Delay Race Condition

**Location:** `src/auth/PostLoginRouter.jsx` line 26-42

**Problem:**
- PostLoginRouter has a **100ms delay** before checking conditions (line 26)
- If `capabilities.ready` becomes `true` **before** the delay completes, the check may pass
- But if the fetch effect hasn't started yet, `ready` is still initial `true`, not actual `true`

**Impact:**
- Router may navigate to Dashboard **before** capabilities are loaded
- Dashboard may render with default capabilities instead of real ones

**Evidence:**
```typescript
// T=600ms: PostLoginRouter mounts
setTimeout(() => {
  if (authReady && user && capabilities?.ready) { // ✅ All true
    navigate('/dashboard'); // ✅ Navigates
  }
}, 100); // ⚠️ But capabilities fetch may not have started yet!

// T=700ms: CapabilityContext fetch starts
// But Dashboard is already rendering!
```

---

### Critical Issue #3: ProtectedRoute Doesn't Check Capabilities

**Location:** `src/components/ProtectedRoute.jsx` line 27-72

**Problem:**
- ProtectedRoute checks `authReady` and `isPreWarming` but **does NOT check `capabilities.ready`**
- User is allowed through to Dashboard even if capabilities aren't loaded

**Impact:**
- Dashboard may render before Kernel is ready
- Components may try to load data before capabilities are available

**Evidence:**
```typescript
// ProtectedRoute checks:
if (isPreWarming) return <LoadingScreen />; // ✅ Checks pre-warming
if (!authReady || loading) return <LoadingScreen />; // ✅ Checks auth
if (!user) navigate('/login'); // ✅ Checks user
// ❌ DOES NOT CHECK capabilities.ready!
```

---

### Critical Issue #4: Login Page Competing Redirect Logic

**Location:** `src/pages/login.jsx` line 54-71

**Problem:**
- Login page has **TWO competing useEffects**:
  1. Line 54-63: Redirects to `/auth/post-login` if `hasUser`
  2. Line 66-71: Redirects to `/dashboard` if `ready && user`
- The first effect may fire **before** capabilities are loaded
- The second effect may never fire if user navigates away

**Impact:**
- User may navigate to `/auth/post-login` before capabilities are ready
- PostLoginRouter may then navigate to Dashboard before capabilities are loaded

**Evidence:**
```typescript
// Effect 1: Always fires if hasUser
useEffect(() => {
  if (hasUser) {
    navigate('/auth/post-login'); // ✅ Fires immediately
  }
}, [authReady, hasUser, navigate]);

// Effect 2: Only fires if ready && user
useEffect(() => {
  if (ready && user) {
    navigate('/dashboard'); // ⚠️ May never fire if user navigates away
  }
}, [ready, user, navigate]);
```

---

## HYPOTHESIS TESTING

### Hypothesis 1: Hard Refresh Clears Stale React Router Context

**Status:** ✅ **LIKELY**

**Evidence:**
- React Router maintains internal state cache for route matching
- If a route fails to load (500 error), Router may cache the failure
- Hard refresh clears browser cache and forces Router to re-initialize
- The "Failed to fetch dynamically imported module" error suggests module cache issue

**Conclusion:**
- Hard refresh likely clears React Router's internal state cache
- This forces Router to re-evaluate routes and re-fetch lazy-loaded modules
- However, this is a **symptom**, not the root cause

---

### Hypothesis 2: Hard Refresh Clears Failed Vite HMR State

**Status:** ⚠️ **POSSIBLE**

**Evidence:**
- Vite HMR (Hot Module Replacement) maintains module state in development
- If a module fails to load, HMR may cache the failure
- Hard refresh clears HMR state and forces fresh module load
- However, this should only affect development, not production

**Conclusion:**
- Hard refresh may clear Vite HMR state in development
- But the issue likely persists in production (needs verification)
- This is a **development-only symptom**

---

### Hypothesis 3: Hard Refresh Triggers Un-triggered useEffect

**Status:** ✅ **LIKELY**

**Evidence:**
- CapabilityContext `ready` state never changes (always `true`)
- React may not trigger re-renders because state doesn't change
- Hard refresh forces all components to unmount and remount
- This triggers all `useEffect` hooks to run again

**Conclusion:**
- Hard refresh forces component remount
- This triggers `useEffect` hooks that may not have fired
- CapabilityContext fetch effect runs again and loads capabilities
- This is the **primary root cause**

---

## ROOT CAUSE ANALYSIS

### Primary Root Cause: CapabilityContext `ready` State Never Changes

**The Problem:**
- CapabilityContext **starts with `ready: true`** (initial state)
- During fetch, it **stays `ready: true`** (no state change)
- After fetch, it **stays `ready: true`** (no state change)
- **React doesn't detect a state change** because the value never transitions

**Why This Causes Refresh-Lock:**
1. Components that depend on `capabilities.ready` don't re-render when capabilities are loaded
2. `useEffect` hooks with `capabilities.ready` in dependencies don't fire
3. PostLoginRouter may navigate before capabilities are actually loaded
4. Dashboard may render with default capabilities instead of real ones
5. Hard refresh forces remount, triggering all effects again

**The Fix (Not Applied):**
- CapabilityContext should start with `ready: false`
- Set `ready: true` only after capabilities are successfully loaded
- This ensures React detects the state change and triggers re-renders

---

### Secondary Root Cause: PostLoginRouter 100ms Delay Race Condition

**The Problem:**
- PostLoginRouter has a 100ms delay before checking conditions
- If `capabilities.ready` is `true` (initial state) before fetch starts, router navigates
- But capabilities may not be loaded yet

**Why This Causes Refresh-Lock:**
1. Router navigates to Dashboard before capabilities are loaded
2. Dashboard renders with default capabilities
3. Components may fail or show incorrect data
4. Hard refresh forces capabilities to load before navigation

**The Fix (Not Applied):**
- PostLoginRouter should wait for `capabilities.ready` to transition from `false → true`
- Or check `capabilities.loading === false` instead of `ready === true`
- Or remove the 100ms delay and check conditions immediately

---

### Tertiary Root Cause: ProtectedRoute Doesn't Check Capabilities

**The Problem:**
- ProtectedRoute checks `authReady` and `isPreWarming` but not `capabilities.ready`
- User is allowed through to Dashboard even if capabilities aren't loaded

**Why This Causes Refresh-Lock:**
1. Dashboard may render before Kernel is ready
2. Components may try to load data before capabilities are available
3. This causes errors or incorrect behavior
4. Hard refresh forces capabilities to load before Dashboard renders

**The Fix (Not Applied):**
- ProtectedRoute should check `capabilities.ready` before allowing navigation
- Or use `isSystemReady` from `useDashboardKernel` instead of just `authReady`

---

## RECOMMENDATIONS (NOT APPLIED)

### Recommendation 1: Fix CapabilityContext `ready` State Transitions

**Change:**
```typescript
// Start with ready: false
const [capabilities, setCapabilities] = useState<CapabilityData>({
  // ...
  ready: false, // ✅ Start false
  // ...
});

// Set ready: true only after successful fetch
setCapabilities({
  // ...
  ready: true, // ✅ Only after fetch completes
  // ...
});
```

**Impact:**
- React will detect state change from `false → true`
- Components will re-render when capabilities are loaded
- `useEffect` hooks will fire when `ready` becomes `true`

---

### Recommendation 2: Fix PostLoginRouter Delay Logic

**Change:**
```typescript
// Remove delay or check loading state
useEffect(() => {
  if (authReady && user && capabilities?.ready && !capabilities?.loading) {
    // ✅ Check both ready AND not loading
    navigate('/dashboard');
  }
}, [authReady, user, capabilities?.ready, capabilities?.loading, navigate]);
```

**Impact:**
- Router waits for capabilities to finish loading
- Dashboard renders with real capabilities, not defaults

---

### Recommendation 3: Fix ProtectedRoute to Check Capabilities

**Change:**
```typescript
const { isSystemReady } = useDashboardKernel();

if (!isSystemReady) {
  return <LoadingScreen message="Initializing..." />;
}
```

**Impact:**
- ProtectedRoute waits for Kernel to be ready
- Dashboard only renders when capabilities are loaded

---

## CONCLUSION

The refresh-lock issue is caused by **multiple cascading race conditions** where:

1. **CapabilityContext `ready` state never changes** (always `true`), preventing React from detecting state transitions
2. **PostLoginRouter navigates before capabilities are loaded** due to 100ms delay and initial `ready: true` state
3. **ProtectedRoute doesn't check capabilities**, allowing navigation before Kernel is ready
4. **Login page has competing redirect logic** that may navigate before capabilities are ready

**Hard refresh works because:**
- It forces all components to unmount and remount
- This triggers all `useEffect` hooks to run again
- CapabilityContext fetch effect runs and loads capabilities
- Components re-render with real capabilities

**The fix requires:**
- Changing CapabilityContext to start with `ready: false` and transition to `true` only after fetch
- Fixing PostLoginRouter to wait for capabilities to finish loading
- Fixing ProtectedRoute to check `isSystemReady` instead of just `authReady`

---

**END OF ANALYSIS**
