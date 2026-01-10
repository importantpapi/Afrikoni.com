# 🚀 Deploy Website for ChatGPT/AI Access

## Quick Deploy Options

### Option 1: Vercel (Easiest - Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **You'll get a URL like:** `https://afrikoni-marketplace.vercel.app`

### Option 2: Netlify

1. **Install Netlify CLI:**
   ```bash
   npm i -g netlify-cli
   ```

2. **Build and deploy:**
   ```bash
   npm run build
   netlify deploy --prod --dir=dist
   ```

### Option 3: ngrok (Temporary - For Testing)

1. **Install ngrok:**
   - Download from: https://ngrok.com/download
   - Or: `brew install ngrok` (Mac)

2. **Start your dev server:**
   ```bash
   npm run dev
   ```

3. **In another terminal, run ngrok:**
   ```bash
   ngrok http 5173
   ```

4. **You'll get a URL like:** `https://abc123.ngrok.io`

5. **Share this URL with ChatGPT**

## 🔗 After Deployment

Once deployed, you'll have a public URL like:
- `https://your-project.vercel.app`
- `https://your-project.netlify.app`
- `https://abc123.ngrok.io` (temporary)

**Share this URL with ChatGPT to review your website!**

## 📋 Environment Variables

Make sure to set these in your deployment platform:

- `VITE_SUPABASE_URL` - Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## ✅ Pre-Deployment Checklist

- [ ] Build succeeds: `npm run build`
- [ ] No console errors
- [ ] All environment variables set
- [ ] Supabase project is public/accessible
- [ ] All routes work
- [ ] Mobile responsive

---

**Recommended:** Use Vercel for the easiest deployment experience!

