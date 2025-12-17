# 🤖 Automated Task Execution Guide

## What Can Be Automated vs Manual

### ✅ Can Be Automated (After Manual Migration)
- Migration verification
- System structure checks
- Database connectivity tests

### ⚠️ Must Be Done Manually
- **Migration Application** (Supabase security - must use Dashboard)
- **End-to-End Testing** (requires user interaction)
- **Smoke Tests** (requires user interaction)
- **Deployment** (requires hosting setup)

---

## Quick Start

### Step 1: Apply Migration (MANUAL - Required First)

**You must do this manually via Supabase Dashboard:**

1. Open: https://supabase.com/dashboard
2. Select project: `qkeeufeiaphqylsnfhza`
3. Go to: SQL Editor
4. Copy: `supabase/migrations/20250116000000_extend_quotes_table.sql`
5. Paste and Run

**Expected**: "Success. No rows returned."

### Step 2: Automated Verification

After applying migration, run:

```bash
npm run verify-migration
```

This will automatically verify:
- ✅ Migration columns exist (incoterms, moq, status)
- ✅ Status constraint allows quote_submitted
- ✅ All tables accessible
- ✅ System structure correct

### Step 3: Manual Testing

Follow: `COMPLETE_ALL_TASKS.md` for:
- End-to-end RFQ flow testing
- Smoke tests
- Deployment

---

## Automated Commands

```bash
# Verify migration and system
npm run verify-migration

# Same as above
npm run verify
```

---

## Status Check

Run verification to see current status:

```bash
npm run verify-migration
```

**Green ✅ = Ready to proceed**  
**Red ❌ = Fix issues first**

---

*Migration must be applied manually first, then automation can verify and test.*
