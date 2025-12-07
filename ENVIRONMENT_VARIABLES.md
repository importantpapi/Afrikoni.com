# 🔐 Environment Variables Guide

## Required Variables

### VITE_SUPABASE_URL
**Required:** Yes  
**Description:** Your Supabase project URL  
**Value:** `https://qkeeufeiaphqylsnfhza.supabase.co`  
**Where to Set:**
- Vercel: Dashboard → Project → Settings → Environment Variables
- Local: `.env` file in root directory

### VITE_SUPABASE_ANON_KEY
**Required:** Yes  
**Description:** Your Supabase anonymous/public key  
**Value:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWV1ZmVpYXBocXlsc25maHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYwNjYsImV4cCI6MjA4MDAxMjA2Nn0.CaGKQ3C5rz-XP-5r2I8xrHZ7F-5w4Z-1yzxtclddQus`  
**Where to Set:**
- Vercel: Dashboard → Project → Settings → Environment Variables
- Local: `.env` file in root directory

---

## Optional Variables

### VITE_OPENAI_API_KEY
**Required:** No  
**Description:** OpenAI API key for KoniAI features  
**Format:** `sk-proj-...`  
**Where to Set:**
- Vercel: Dashboard → Project → Settings → Environment Variables
- Local: `.env` file in root directory

**Note:** Without this key, KoniAI features will show a banner but won't function.

---

## Local Development Setup

### Create `.env` file in root directory:

```env
VITE_SUPABASE_URL=https://qkeeufeiaphqylsnfhza.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWV1ZmVpYXBocXlsc25maHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYwNjYsImV4cCI6MjA4MDAxMjA2Nn0.CaGKQ3C5rz-XP-5r2I8xrHZ7F-5w4Z-1yzxtclddQus
VITE_OPENAI_API_KEY=sk-proj-... (optional)
```

### Verify Setup:
```bash
# Check if variables are loaded
npm run dev
# Check browser console - should not show "VITE_SUPABASE_URL not set" warnings
```

---

## Vercel Deployment Setup

### Steps:
1. Go to: https://vercel.com/youbas-projects/afrikoni-marketplace/settings/environment-variables
2. Click "Add New"
3. Add each variable:
   - Key: `VITE_SUPABASE_URL`
   - Value: `https://qkeeufeiaphqylsnfhza.supabase.co`
   - Environment: Production, Preview, Development (select all)
4. Repeat for `VITE_SUPABASE_ANON_KEY`
5. (Optional) Add `VITE_OPENAI_API_KEY` if using KoniAI
6. Click "Save"
7. Redeploy: `vercel --prod` or push to GitHub

---

## Verification

### Check if variables are set:
```javascript
// In browser console
console.log(import.meta.env.VITE_SUPABASE_URL)
console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
```

### Expected Output:
- `VITE_SUPABASE_URL`: Should show the Supabase URL
- `VITE_SUPABASE_ANON_KEY`: Should show the key (not undefined)

---

## Troubleshooting

### Issue: "VITE_SUPABASE_URL not set"
**Solution:**
1. Check `.env` file exists in root directory
2. Verify variable names start with `VITE_`
3. Restart dev server: `npm run dev`
4. For Vercel: Check environment variables in dashboard

### Issue: "Cannot connect to Supabase"
**Solution:**
1. Verify `VITE_SUPABASE_URL` is correct
2. Verify `VITE_SUPABASE_ANON_KEY` is correct
3. Check Supabase project is active
4. Check network/firewall settings

### Issue: "Storage bucket not found"
**Solution:**
1. Go to Supabase Dashboard → Storage
2. Verify `product-images` bucket exists
3. Verify bucket is PUBLIC
4. Check storage policies allow public read

---

## Security Notes

- ✅ `VITE_SUPABASE_ANON_KEY` is safe to expose (it's public)
- ✅ `VITE_SUPABASE_URL` is safe to expose (it's public)
- ⚠️ `VITE_OPENAI_API_KEY` should be kept secret (but Vite prefixes with VITE_ make it public in client code)
- 💡 For production, consider using Supabase Edge Functions for sensitive operations

---

## Quick Reference

| Variable | Required | Used For |
|----------|----------|----------|
| `VITE_SUPABASE_URL` | ✅ Yes | Database, Auth, Storage |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Database, Auth, Storage |
| `VITE_OPENAI_API_KEY` | ❌ No | KoniAI features |

---

**Status:** ✅ All environment variables documented and ready

