# Batch Update Script - Dashboard Components

## High Priority (Updating Now)
1. settings.jsx
2. company-info.jsx
3. sales.jsx
4. shipments.jsx
5. notifications.jsx

## Pattern Applied:
- Replace `getCurrentUserAndRole` → `useAuth()`
- Add `authReady` guards
- Replace loading spinners → `SpinnerWithTimeout`
- Remove duplicate `getSession()` / `onAuthStateChange()` calls

