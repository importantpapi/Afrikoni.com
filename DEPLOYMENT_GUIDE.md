# 🚀 Deployment Guide - Afrikoni Marketplace

## ✅ GitHub Repository
- **Repository**: https://github.com/importantpapi/Afrikoni.com.git
- **Branch**: `main`
- **Status**: ✅ All changes committed and pushed

## 📦 Vercel Deployment

### Step 1: Connect to Vercel

1. Go to [https://vercel.com](https://vercel.com)
2. Sign in with your GitHub account
3. Click **"Add New Project"**
4. Import from GitHub: `importantpapi/Afrikoni.com`
5. Vercel will auto-detect Vite framework from `vercel.json`

### Step 2: Configure Build Settings

Vercel should auto-detect these from `vercel.json`:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Step 3: Set Environment Variables

In Vercel dashboard → Project Settings → Environment Variables, add:

#### Required Variables:
```
VITE_SUPABASE_URL=https://qkeeufeiaphqylsnfhza.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWV1ZmVpYXBocXlsc25maHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYwNjYsImV4cCI6MjA4MDAxMjA2Nn0.CaGKQ3C5rz-XP-5r2I8xrHZ7F-5w4Z-1yzxtclddQus
```

#### Optional (if using direct email):
```
VITE_EMAIL_PROVIDER=resend
VITE_EMAIL_API_KEY=re_WQrisYJe_MQgpRaH5s3mCTHZFmsKugZbd
```

**Important**: 
- Set these for **Production**, **Preview**, and **Development** environments
- After adding variables, **redeploy** the project

### Step 4: Supabase Edge Function Secrets

The email service uses a Supabase Edge Function. Set the secret in Supabase:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Edge Functions** → **Secrets**
4. Add secret:
   - **Name**: `RESEND_API_KEY`
   - **Value**: `re_WQrisYJe_MQgpRaH5s3mCTHZFmsKugZbd`

### Step 5: Deploy

1. Click **"Deploy"** in Vercel
2. Wait for build to complete
3. Your app will be live at: `https://your-project.vercel.app`

### Step 6: Custom Domain (Optional)

1. In Vercel dashboard → Settings → Domains
2. Add your custom domain (e.g., `afrikoni.com`)
3. Follow DNS configuration instructions

## 🔄 Automatic Deployments

Vercel will automatically deploy:
- **Production**: Every push to `main` branch
- **Preview**: Every push to other branches or pull requests

## 📝 Post-Deployment Checklist

- [ ] Verify environment variables are set correctly
- [ ] Test email functionality (newsletter subscription)
- [ ] Test product image uploads
- [ ] Test notification system
- [ ] Verify Supabase Edge Function is deployed
- [ ] Check that `hello@afrikoni.com` is used for all emails
- [ ] Test mobile navigation
- [ ] Verify hybrid dashboard shows Products link

## 🐛 Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify `package.json` has correct build script
- Check Vercel build logs for errors

### Email Not Working
- Verify `RESEND_API_KEY` is set in Supabase Edge Function secrets
- Check that `hello@afrikoni.com` domain is verified in Resend
- Test email service from `/dashboard/test-emails` page

### Images Not Loading
- Verify Supabase Storage bucket `product-images` is public
- Check CORS settings in Supabase Storage

## 📚 Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Resend Documentation](https://resend.com/docs)

---

**Last Updated**: After quick save feature and notification system implementation
