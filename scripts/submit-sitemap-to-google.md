# 🗺️ Submit Sitemap to Google Search Console - Step-by-Step Guide

## ✅ **Step-by-Step Instructions**

### **1. Access Google Search Console**
1. Go to: https://search.google.com/search-console
2. Sign in with your Google account
3. (Use the same account that has access to your website)

### **2. Add Property (If Not Already Added)**
1. Click **"Add Property"** (top left)
2. Select **"URL prefix"**
3. Enter: `https://afrikoni.com`
4. Click **"Continue"**

### **3. Verify Ownership**
Choose one of these methods:

**Option A: HTML File (Easiest)**
1. Download the HTML verification file
2. Upload it to your `public/` folder
3. Deploy to Vercel
4. Click "Verify" in Search Console

**Option B: HTML Tag**
1. Copy the meta tag provided
2. Add it to your `index.html` `<head>` section
3. Deploy to Vercel
4. Click "Verify" in Search Console

**Option C: DNS Record**
1. Add the TXT record to your domain DNS
2. Wait for DNS propagation (can take up to 48 hours)
3. Click "Verify" in Search Console

**Option D: Google Analytics** (if you have GA4 set up)
1. If you have Google Analytics connected, you can verify automatically
2. Click "Verify" in Search Console

### **4. Submit Sitemap**
Once verified:
1. In the left sidebar, click **"Sitemaps"**
   - (Under "Indexing" section)
2. In the "Add a new sitemap" field, enter:
   ```
   sitemap.xml
   ```
3. Click **"Submit"**

### **5. Verify Submission**
- You should see a success message
- The sitemap will appear in the list with status "Success"
- Google will start crawling your sitemap (can take a few days)

---

## 📋 **What Gets Indexed**

Your sitemap includes:
- ✅ Homepage and main pages
- ✅ Marketplace and product pages
- ✅ Category pages
- ✅ Supplier pages
- ✅ RFQ pages
- ✅ All active products

---

## ⏱️ **Timeline**

- **Verification:** Immediate (if using HTML file/tag)
- **Sitemap Processing:** 1-3 days
- **Full Indexing:** 1-2 weeks (depending on site size)

---

## ✅ **Verification Checklist**

- [ ] Accessed Google Search Console
- [ ] Added property: `https://afrikoni.com`
- [ ] Verified ownership
- [ ] Navigated to Sitemaps section
- [ ] Submitted: `sitemap.xml`
- [ ] Confirmed "Success" status

---

## 🔍 **After Submission**

**Monitor Progress:**
1. Go to **"Coverage"** report
2. Check how many pages are indexed
3. Review any errors or warnings

**Check Indexing:**
1. Search: `site:afrikoni.com` in Google
2. See which pages are indexed
3. Monitor over the next few days

---

## 📝 **Sitemap URL**

Your sitemap is available at:
```
https://afrikoni.com/sitemap.xml
```

**Test it:**
- Open in browser to see XML content
- Should show all your pages with URLs, last modified dates, priorities

---

## 🎯 **Why This Matters**

**Benefits:**
- ✅ Faster indexing of new pages
- ✅ Better search visibility
- ✅ Google knows about all your pages
- ✅ Improved SEO rankings
- ✅ Better discoverability

---

**Estimated Time:** 5 minutes  
**Difficulty:** Easy  
**Required Access:** Google account with website ownership

