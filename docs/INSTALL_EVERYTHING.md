# 🚀 Complete Installation Guide

**Goal:** Install everything needed to run the project perfectly

---

## 📋 **Installation Checklist**

### **Step 1: Install Node.js** ⚠️

**Check if installed:**
```bash
node --version
npm --version
```

**If not installed, install via:**

**Option A: Official Installer (Easiest)**
1. Go to: https://nodejs.org/en/download/
2. Download macOS installer (.pkg)
3. Run installer
4. Verify: `node --version` (should show v18.x.x or higher)

**Option B: Homebrew**
```bash
brew install node@18
```

**Option C: nvm (Node Version Manager)**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node.js
nvm install 18
nvm use 18
```

---

### **Step 2: Install Dependencies** ⚠️

Once Node.js is installed:

```bash
cd "/Users/youba/Library/Mobile Documents/com~apple~CloudDocs/Desktop/Afrikonimarketplace"
npm install
```

**Expected:** All packages from `package.json` installed

---

### **Step 3: Verify Environment Variables** ✅

`.env` file already exists with:
- ✅ `VITE_SUPABASE_URL`
- ✅ `VITE_SUPABASE_ANON_KEY`
- ✅ `VITE_FLW_PUBLIC_KEY`
- ✅ `VITE_GA4_ID`

---

### **Step 4: Test Development Server** ⚠️

```bash
npm run dev
```

**Expected:**
- Server starts on `http://localhost:5173`
- No errors
- Homepage loads

---

### **Step 5: Test Production Build** ⚠️

```bash
npm run build
npm run preview
```

**Expected:**
- Build completes successfully
- Preview server starts
- Production build works

---

## 🔧 **Additional Tools (Optional but Recommended)**

### **GitHub CLI**
```bash
brew install gh
gh auth login
```

### **Vercel CLI**
```bash
npm install -g vercel
vercel login
```

### **VS Code Extensions (If using VS Code)**
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- React snippets

---

## ✅ **Verification Commands**

Run these to verify everything works:

```bash
# Check Node.js
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher

# Check dependencies
ls node_modules | wc -l  # Should show 160+ packages

# Check environment
cat .env | grep VITE_SUPABASE_URL  # Should show URL

# Test build
npm run build  # Should complete without errors
```

---

## 🎯 **Quick Start After Installation**

```bash
# 1. Navigate to project
cd "/Users/youba/Library/Mobile Documents/com~apple~CloudDocs/Desktop/Afrikonimarketplace"

# 2. Start development server
npm run dev

# 3. Open browser
# http://localhost:5173
```

---

## 📊 **Current Status**

| Component | Status | Action Needed |
|-----------|--------|---------------|
| Node.js | ⚠️ Check | Install if missing |
| Dependencies | ✅ Installed | Verify with `npm install` |
| Environment | ✅ Configured | Already set |
| Development | ⏸️ Waiting | Needs Node.js |
| Production Build | ⏸️ Waiting | Needs Node.js |

---

**Once Node.js is installed, run `npm install` and `npm run dev` to start!** 🚀

