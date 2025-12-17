# Database Schema Analysis & Fixes

**Date:** January 15, 2025  
**Status:** ✅ **All Tables Exist, Some Schema Differences Found**

---

## ✅ **VERIFIED: All Tables Exist**

| Table | Status | RLS | Rows | Notes |
|-------|--------|-----|------|-------|
| `companies` | ✅ EXISTS | ✅ | 234 | Fully functional |
| `rfqs` | ✅ EXISTS | ✅ | 3 | **Note: Plural, not `rfq`** |
| `messages` | ✅ EXISTS | ✅ | 0 | Schema differs from guide |
| `notifications` | ✅ EXISTS | ✅ | 1 | Schema differs from guide |
| `orders` | ✅ EXISTS | ✅ | 0 | References `rfqs` (correct) |
| `shipments` | ✅ EXISTS | ✅ | 0 | Fully functional |
| `company_team` | ✅ EXISTS | ✅ | 0 | Fully functional |
| `profiles` | ✅ EXISTS | ✅ | 1 | Has `company_id` ✅ |

---

## 🔍 **SCHEMA DIFFERENCES FOUND**

### **1. Notifications Table**

**Guide Expects:**
- `receiver_id` (UUID)
- `receiver_company_id` (UUID)
- `type` (with specific CHECK constraint)
- `related_type` (TEXT)

**Actual Schema:**
- ✅ `user_id` (UUID) - **Different name**
- ✅ `company_id` (UUID) - **Different name**
- ✅ `user_email` (TEXT) - **Additional column**
- ✅ `type` (TEXT) - **No CHECK constraint**
- ✅ `related_id` (UUID)
- ❌ `related_type` - **Missing**

**Status:** Schema works but uses different column names. RLS policies are already optimized.

### **2. Messages Table**

**Guide Expects:**
- `sender_user_id` (UUID)
- `receiver_user_id` (UUID)
- `rfq_id` (UUID with FK to `rfq`)

**Actual Schema:**
- ❌ `sender_user_id` - **Missing**
- ❌ `receiver_user_id` - **Missing**
- ✅ `sender_company_id` (UUID)
- ✅ `receiver_company_id` (UUID)
- ✅ `sender_user_email` (TEXT) - **Different approach**
- ❌ `rfq_id` - **Missing**

**Status:** Uses company-based approach instead of user-based. May need `rfq_id` for linking.

### **3. RFQ Table Name**

**Guide Expects:** `rfq` (singular)  
**Actual:** `rfqs` (plural) ✅  
**Status:** Frontend uses correct name. No issue.

---

## 🛠️ **RECOMMENDED FIXES**

### **Fix 1: Add Missing Columns to Messages Table**

```sql
-- Add sender_user_id and receiver_user_id for user-level messaging
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS sender_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS receiver_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add rfq_id for linking messages to RFQs
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS rfq_id UUID REFERENCES public.rfqs(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_messages_sender_user_id ON public.messages(sender_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_user_id ON public.messages(receiver_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_rfq_id ON public.messages(rfq_id);
```

### **Fix 2: Add Missing Column to Notifications Table**

```sql
-- Add related_type for better notification categorization
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS related_type TEXT;

-- Add action_url if missing
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS action_url TEXT;

-- Add metadata if missing
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
```

### **Fix 3: Update RLS Policies for New Columns**

The existing RLS policies should work, but we may want to add support for `sender_user_id`/`receiver_user_id` in messages.

---

## ✅ **WHAT'S ALREADY CORRECT**

1. ✅ All tables exist
2. ✅ `profiles.company_id` exists
3. ✅ All RLS policies are optimized
4. ✅ Foreign keys are correct (`orders.rfq_id` → `rfqs.id`)
5. ✅ Frontend uses correct table names

---

## 📋 **ACTION PLAN**

### **Option 1: Minimal Changes (Recommended)**
Only add missing columns that are actually needed:
- Add `rfq_id` to messages (if needed for linking)
- Add `related_type` to notifications (if needed)

### **Option 2: Full Schema Alignment**
Add all columns from the guide, but this may require code changes.

**Recommendation:** Start with Option 1, add columns only if frontend code actually needs them.

---

## 🎯 **CONCLUSION**

**Your database is functional!** The schema differences are mostly naming conventions:
- `notifications` uses `user_id`/`company_id` instead of `receiver_id`/`receiver_company_id`
- `messages` uses company-based approach instead of user-based
- All tables exist and RLS is properly configured

**No critical fixes needed** unless you specifically need the missing columns for new features.






