# Afrikoni Marketplace - Deployment Guide

## ✅ GitHub Repository
**Status:** ✅ Already connected and pushed
- **Repository:** https://github.com/importantpapi/Afrikoni.com.git
- **Branch:** main
- **Latest commit:** bd2e6e2

## 🚀 Vercel Deployment

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com
   - Sign in with your GitHub account

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select "Import Git Repository"
   - Choose: `importantpapi/Afrikoni.com`
   - Click "Import"

3. **Configure Project Settings**
   - **Framework Preset:** Vite
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`

4. **Environment Variables**
   Add the following environment variables in Vercel dashboard:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_OPENAI_API_KEY=your_openai_api_key
   VITE_OPENAI_MODEL=gpt-4o-mini
   ```

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Your site will be live at: `https://afrikoni-com.vercel.app` (or custom domain)

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI** (if not already installed)
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - Select your project settings
   - Add environment variables when prompted

4. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Environment Variables Required

Make sure to add these in Vercel dashboard (Settings → Environment Variables):

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `VITE_OPENAI_API_KEY` - Your OpenAI API key (for KoniAI features)
- `VITE_OPENAI_MODEL` - OpenAI model (default: `gpt-4o-mini`)

### Vercel Configuration

The project already has `vercel.json` configured with:
- ✅ SPA routing (all routes redirect to index.html)
- ✅ Security headers (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection)
- ✅ Cache control for static assets

### Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test authentication (login/signup)
- [ ] Test product creation and marketplace
- [ ] Test RFQ creation and quotes
- [ ] Verify Supabase connection
- [ ] Test AI features (KoniAI)
- [ ] Check mobile responsiveness
- [ ] Verify translations work in all languages
- [ ] Test payment/escrow flows (if applicable)

### Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Wait for SSL certificate (automatic)

### Continuous Deployment

Vercel automatically deploys on every push to `main` branch:
- ✅ Automatic deployments on git push
- ✅ Preview deployments for pull requests
- ✅ Automatic SSL certificates

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support

