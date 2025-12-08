# 🚀 Deployment Guide - Afrikoni.com

## ✅ GitHub Status
- **Repository**: https://github.com/importantpapi/Afrikoni.com.git
- **Branch**: `main`
- **Latest Commit**: WhatsApp Community integration pushed successfully

## 📋 Vercel Deployment Steps

### 1. Connect to Vercel

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"Add New Project"**
3. Import your GitHub repository: `importantpapi/Afrikoni.com`
4. Vercel will auto-detect it's a Vite project

### 2. Configure Build Settings

Vercel should auto-detect these, but verify:
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 3. Add Environment Variables

In Vercel project settings → Environment Variables, add:

#### Required:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_WHATSAPP_COMMUNITY_LINK=https://chat.whatsapp.com/KmhNH1jLkPrHg18ktpNa5v
```

#### Optional (if you use them):
```
VITE_GA4_MEASUREMENT_ID=your_ga4_measurement_id
VITE_SENTRY_DSN=your_sentry_dsn
```

**Important**: 
- Add these for **Production**, **Preview**, and **Development** environments
- The WhatsApp link is already set, but you can update it if needed

### 4. Deploy

1. Click **"Deploy"**
2. Vercel will automatically:
   - Install dependencies
   - Build the project
   - Deploy to production

### 5. Post-Deployment Checklist

- [ ] Verify the site loads: `https://your-project.vercel.app`
- [ ] Test `/community` page
- [ ] Test WhatsApp Community CTAs:
  - Dashboard header (desktop & mobile)
  - Profile sidebar
  - Footer link
- [ ] Verify environment variables are set correctly
- [ ] Check browser console for errors
- [ ] Test analytics tracking

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to `main`:
- Every push to `main` → Production deployment
- Pull requests → Preview deployments

## 📝 Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Your Supabase anonymous key |
| `VITE_WHATSAPP_COMMUNITY_LINK` | ✅ Yes | WhatsApp Community invite link |
| `VITE_GA4_MEASUREMENT_ID` | ❌ No | Google Analytics 4 ID |
| `VITE_SENTRY_DSN` | ❌ No | Sentry error tracking DSN |

## 🐛 Troubleshooting

### Build Fails
- Check environment variables are set
- Verify `package.json` scripts are correct
- Check Vercel build logs

### WhatsApp Link Not Working
- Verify `VITE_WHATSAPP_COMMUNITY_LINK` is set in Vercel
- Check browser console for errors
- Ensure the link format is correct: `https://chat.whatsapp.com/...`

### Analytics Not Tracking
- Verify `VITE_GA4_MEASUREMENT_ID` is set (if using GA4)
- Check browser console for analytics errors

## 📞 Support

If you encounter issues:
1. Check Vercel deployment logs
2. Check browser console for errors
3. Verify all environment variables are set
4. Ensure Supabase is accessible

---

**Last Updated**: December 2024
**Repository**: https://github.com/importantpapi/Afrikoni.com.git
