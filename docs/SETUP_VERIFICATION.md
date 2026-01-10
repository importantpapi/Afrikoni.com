# 🔧 Project Setup Verification & Configuration Guide

**Date:** December 13, 2024  
**Status:** New Mac Setup - Complete Reconfiguration

---

## ✅ **Task 1: Project Setup Verification**

### **Node.js Installation Check**

**Current Status:** ⚠️ Node.js not found in PATH

**Action Required:**
1. Install Node.js 18+ (LTS recommended)
   ```bash
   # Using Homebrew (recommended)
   brew install node@18
   
   # Or download from: https://nodejs.org/
   ```

2. Verify installation:
   ```bash
   node --version  # Should show v18.x.x or higher
   npm --version   # Should show 9.x.x or higher
   ```

### **Dependencies Check**

**Current Status:** ⚠️ node_modules incomplete (only .bin found)

**Action Required:**
```bash
cd "/Users/youba/Library/Mobile Documents/com~apple~CloudDocs/Desktop/Afrikonimarketplace"
npm install
```

**Expected Result:**
- All dependencies from `package.json` installed
- `node_modules/` folder populated
- No critical errors

---

## ✅ **Task 2: Environment Variables**

### **Required Variables (MUST HAVE)**

Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://qkeeufeiaphqylsnfhza.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrZWV1ZmVpYXBocXlsc25maHphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0MzYwNjYsImV4cCI6MjA4MDAxMjA2Nn0.CaGKQ3C5rz-XP-5r2I8xrHZ7F-5w4Z-1yzxtclddQus
```

### **Optional Variables (NICE TO HAVE)**

```env
# Payment Gateway
VITE_FLW_PUBLIC_KEY=FLWPUBK-xxxxxxxxxxxxx

# AI Features
VITE_OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx

# Analytics
VITE_GA4_ID=G-XXXXXXXXXX
VITE_SENTRY_DSN=https://xxxxx@xxxxx.ingest.sentry.io/xxxxx

# Social
VITE_WHATSAPP_COMMUNITY_LINK=https://chat.whatsapp.com/KmhNH1jLkPrHg18ktpNa5v
```

### **Vercel Environment Variables**

Add these in Vercel Dashboard:
1. Go to: Project → Settings → Environment Variables
2. Add each variable for **Production, Preview, Development**
3. Variables to add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_FLW_PUBLIC_KEY` (if using payments)
   - `VITE_OPENAI_API_KEY` (if using KoniAI)
   - `VITE_GA4_ID` (if using analytics)
   - `VITE_SENTRY_DSN` (if using error tracking)

---

## ✅ **Task 3: Supabase Connection Verification**

### **Connection Test**

After setting up `.env`, test connection:

```bash
npm run dev
```

**Check Browser Console:**
- ✅ No "Missing Supabase environment variables" errors
- ✅ No connection errors
- ✅ Auth should work (try login)

### **Supabase Dashboard Checks**

1. **Project Status:** https://supabase.com/dashboard/project/qkeeufeiaphqylsnfhza
   - Verify project is active
   - Check API keys match `.env` file

2. **Database Tables:**
   - `profiles` - User profiles
   - `companies` - Company data
   - `products` - Product listings
   - `rfqs` - Trade requests
   - `orders` - Orders
   - `messages` - Messaging

3. **Storage Buckets:**
   - `product-images` - Product photos
   - `files` - General file uploads

4. **RLS Policies:**
   - Verify policies are active
   - Check auth policies allow proper access

---

## ✅ **Task 4: Build & Run Check**

### **Development Server**

```bash
npm run dev
```

**Expected:**
- Server starts on `http://localhost:5173`
- No build errors
- Homepage loads
- Navigation works

### **Production Build**

```bash
npm run build
```

**Expected:**
- Build completes successfully
- `dist/` folder created
- No critical warnings

### **Preview Production Build**

```bash
npm run preview
```

**Expected:**
- Production build runs locally
- All features work
- No runtime errors

---

## ✅ **Task 5: UX & Stability Audit**

### **Known Issues to Check:**

1. **Duplicate Popups:**
   - ✅ Fixed: Newsletter popup debounced
   - ✅ Fixed: Cookie banner visible

2. **Broken Redirects:**
   - ✅ Fixed: "Join logistics network" redirects correctly
   - ✅ Fixed: RFQ flow redirects after login
   - ✅ Fixed: Navbar "Paramètres" → Settings

3. **Messaging:**
   - ✅ Fixed: Typing lag resolved
   - ✅ Fixed: Send button loading state
   - ✅ Fixed: Unique support tickets per user

4. **Dashboard UI:**
   - ✅ Fixed: Large white lines removed
   - ✅ Fixed: Spacing optimized
   - ✅ Fixed: RFQ section working

5. **RFQ Logic:**
   - ✅ Fixed: RFQ creation works
   - ✅ Fixed: Confirmation message shows
   - ✅ Fixed: Status labels updated

---

## 📋 **Quick Setup Checklist**

- [ ] Install Node.js 18+
- [ ] Run `npm install`
- [ ] Create `.env` file with Supabase credentials
- [ ] Test `npm run dev` - should start without errors
- [ ] Verify Supabase connection in browser console
- [ ] Test login/signup flow
- [ ] Test RFQ creation
- [ ] Check dashboard loads correctly
- [ ] Add Vercel environment variables
- [ ] Test production build: `npm run build`

---

## 🚨 **Critical Issues to Fix**

### **If Node.js Not Found:**
```bash
# Install via Homebrew
brew install node@18

# Or download installer
# https://nodejs.org/en/download/
```

### **If Dependencies Fail:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### **If Supabase Connection Fails:**
1. Verify `.env` file exists
2. Check variable names start with `VITE_`
3. Restart dev server
4. Check Supabase project is active

### **If Build Fails:**
```bash
# Check for errors
npm run build 2>&1 | tee build.log

# Common fixes:
# - Update Node.js to 18+
# - Clear cache: rm -rf node_modules .vite
# - Reinstall: npm install
```

---

## 📊 **Status Report**

**Automatically Fixed:**
- ✅ Created `.env.example` template
- ✅ Created setup verification guide
- ✅ Documented all environment variables

**Needs Manual Action:**
- ⚠️ Install Node.js 18+
- ⚠️ Run `npm install`
- ⚠️ Create `.env` file with Supabase credentials
- ⚠️ Add Vercel environment variables
- ⚠️ Test local development server
- ⚠️ Verify Supabase connection

---

## 🎯 **Next Steps**

1. **Install Node.js** (5 min)
2. **Install Dependencies** (2-5 min)
3. **Create .env File** (2 min)
4. **Test Development Server** (1 min)
5. **Verify Supabase Connection** (2 min)
6. **Add Vercel Variables** (5 min)

**Total Time:** ~20 minutes

---

**Ready to proceed once Node.js is installed!** 🚀

