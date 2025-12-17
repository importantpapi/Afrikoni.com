# 📋 Metadata Migration Guide

**Status**: Optional Enhancement  
**Impact**: Improves RFQ data storage structure

---

## What This Migration Does

Adds a `metadata` JSONB column to the `rfqs` table to store structured RFQ data:

- Certifications required
- Incoterms preference
- Purchase type (one-time/ongoing)
- Order value range
- Buyer role
- Company name
- Budget ranges

---

## Why It's Optional

The RFQ creation form **currently works** without this column because:
- Some data is stored in individual columns
- The form handles missing metadata gracefully

However, applying it provides:
- ✅ Better data organization
- ✅ Easier querying of RFQ metadata
- ✅ Future-proof structure
- ✅ Full feature support

---

## How to Apply

### Step 1: Open SQL Editor
👉 https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza/sql/new

### Step 2: Copy Migration SQL
The SQL is already in your clipboard, or copy from:
`supabase/migrations/20250116000001_add_rfq_metadata.sql`

### Step 3: Paste and Run
1. Paste into SQL Editor (Cmd+V / Ctrl+V)
2. Click "Run"
3. Wait for: "Success. No rows returned."

### Step 4: Verify
```bash
npm run test-all
```

**Expected**: RFQ Structure test should show metadata column accessible

---

## Migration SQL

```sql
-- Add metadata column if it doesn't exist
ALTER TABLE public.rfqs
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Add index for metadata queries
CREATE INDEX IF NOT EXISTS idx_rfqs_metadata ON public.rfqs USING gin (metadata);

-- Add comment
COMMENT ON COLUMN public.rfqs.metadata IS 'Structured RFQ metadata (certifications, incoterms, purchase_type, order_value_range, buyer_role, company_name, budget_min, budget_max)';
```

---

## After Applying

The RFQ creation form will be able to store all metadata in a structured JSONB format, making it easier to:
- Query RFQs by metadata fields
- Filter by purchase type, buyer role, etc.
- Analyze RFQ patterns
- Support future features

---

**Note**: This is safe to apply - uses `IF NOT EXISTS` so it won't break if run twice.

