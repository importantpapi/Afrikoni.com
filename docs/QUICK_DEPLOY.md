# ⚡ QUICK DEPLOY GUIDE

**Status:** ✅ All code committed - Ready to deploy!

---

## 🚀 DEPLOY NOW

### Option 1: Automated Script (Easiest)
```bash
./deploy.sh
```

### Option 2: Manual Vercel CLI
```bash
vercel --prod
```

### Option 3: Push to GitHub (Auto-deploy if connected)
```bash
git push origin main
```

---

## 🔐 AFTER DEPLOYMENT

### 1. Set Environment Variables in Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add these:

**Required:**
```
VITE_SUPABASE_URL
https://qkeeufeiaphqylsnfhza.supabase.co

VITE_SUPABASE_ANON_KEY
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWV1ZmVpYXBocXlsc25maHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYwNjYsImV4cCI6MjA4MDAxMjA2Nn0.CaGKQ3C5rz-XP-5r2I8xrHZ7F-5w4Z-1yzxtclddQus
```

**Optional (for KoniAI):**
```
VITE_OPENAI_API_KEY
sk-proj-...
```

### 2. Test Your Deployment

Visit your Vercel URL and test:
- [ ] Homepage loads
- [ ] Login works
- [ ] Signup works
- [ ] Dashboard accessible

### 3. Enable Supabase Security

Go to: **Supabase Dashboard → Authentication → Password Security**
- [ ] Enable "Leaked Password Protection"

---

## ✅ THAT'S IT!

**You're ready to launch!** 🎉

Run `./deploy.sh` or `vercel --prod` to deploy now!

