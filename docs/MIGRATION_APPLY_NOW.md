# 🚀 Apply Migration Now - One-Click Guide

## Quick Method (5 minutes)

### Step 1: Open SQL Editor
**Click this link to open SQL Editor directly:**
👉 https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/sql/new

### Step 2: Copy Migration SQL
```bash
# Run this command to copy migration SQL to clipboard (Mac):
cat supabase/migrations/20250116000000_extend_quotes_table.sql | pbcopy

# Or open the file and copy manually:
open supabase/migrations/20250116000000_extend_quotes_table.sql
```

### Step 3: Paste and Run
1. Paste into SQL Editor (Cmd+V / Ctrl+V)
2. Click **"Run"** button
3. Wait for: "Success. No rows returned."

### Step 4: Verify
```bash
npm run check-all
```

**Expected**: All checks should pass ✅

---

## What the Migration Does

- ✅ Adds `incoterms` column (text)
- ✅ Adds `moq` column (integer)  
- ✅ Updates `status` constraint to allow `quote_submitted`
- ✅ Creates trigger to prevent editing submitted quotes
- ✅ Adds column comments

**Safe to run**: Uses `IF NOT EXISTS` - won't break if run twice

---

## After Migration

Once migration is applied and verified:

1. ✅ Run: `npm run check-all` (should all pass)
2. ✅ Test end-to-end flow (see `COMPLETE_ALL_TASKS.md`)
3. ✅ Complete smoke tests
4. ✅ Deploy frontend

---

**That's it!** After migration, system is 100% operational. 🚀
