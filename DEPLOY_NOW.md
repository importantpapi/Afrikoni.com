# 🚀 DEPLOY TO VERCEL NOW

## ✅ GitHub: DONE
Code is already pushed to: `https://github.com/importantpapi/Afrikoni.com.git`

## 🌐 Vercel Deployment

### Quick Method (5 minutes):

1. **Go to:** https://vercel.com/new
2. **Sign in** with GitHub
3. **Click "Import"** next to `importantpapi/Afrikoni.com`
4. **Configure:**
   - Framework: `Vite` (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Add Environment Variables:**
   - Click "Environment Variables"
   - Add:
     - `VITE_SUPABASE_URL` = your Supabase URL
     - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
6. **Click "Deploy"**

### Or Use CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

---

**After deployment, your site will be live at:** `https://afrikoni.vercel.app` (or your custom domain)

