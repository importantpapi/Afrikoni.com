# Update Email API Key in Vercel

## 🔑 Your Resend API Key

```
re_QzfeoKRt_2MpMRAe7f66oHfYmjCda3y5w
```

## ✅ Steps to Update in Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. **Go to your project** in Vercel dashboard
2. **Navigate to:** Settings → Environment Variables
3. **Find:** `VITE_EMAIL_API_KEY`
4. **Click** the three-dot menu (⋯) next to it
5. **Select:** "Edit" or "Update"
6. **Paste** the complete API key:
   ```
   re_QzfeoKRt_2MpMRAe7f66oHfYmjCda3y5w
   ```
7. **Verify:**
   - Environment: "All Environments" (or Production/Preview as needed)
   - Value is complete (should be ~50+ characters)
8. **Click:** "Save"

### Option 2: Via Vercel CLI (If you prefer)

```bash
# Remove old key (if needed)
npx vercel env rm VITE_EMAIL_API_KEY production

# Add new key
npx vercel env add VITE_EMAIL_API_KEY production
# When prompted, paste: re_QzfeoKRt_2MpMRAe7f66oHfYmjCda3y5w

# Also add to preview (optional)
npx vercel env add VITE_EMAIL_API_KEY preview
# Paste the same key
```

## ✅ Verification Checklist

After updating:

- [ ] `VITE_EMAIL_PROVIDER` = `resend` ✓ (already set)
- [ ] `VITE_EMAIL_API_KEY` = `re_QzfeoKRt_2MpMRAe7f66oHfYmjCda3y5w` ✓
- [ ] Key starts with `re_` ✓
- [ ] Key is complete (not truncated) ✓
- [ ] Environment set to "All Environments" or specific ones

## 🧪 Test After Update

1. **Wait for deployment** (if auto-deploy is enabled)
2. **Or manually deploy** (when you're ready)
3. **Go to:** `/dashboard/test-emails`
4. **Enter your email** and test
5. **Verify:**
   - Configuration shows green checkmarks
   - Test emails send successfully
   - From address shows `hello@afrikoni.com`
   - Check your inbox for received emails

## ⚠️ Important Notes

- **Do NOT commit** the API key to GitHub (it's already in `.gitignore`)
- **Keep the key secure** - don't share it publicly
- **Verify domain** in Resend dashboard (if not already done)
- **Check Resend dashboard** for email logs and delivery status

## 🔍 Troubleshooting

### If emails still don't work:

1. **Check Resend dashboard:**
   - Go to https://resend.com/api-keys
   - Verify key is active
   - Check domain verification status

2. **Verify in Vercel:**
   - Key is not truncated
   - Environment is set correctly
   - Redeploy after updating

3. **Test in browser console:**
   ```javascript
   // After deployment, test in browser console:
   testEmailService('your@email.com')
   ```

4. **Check test page:**
   - `/dashboard/test-emails`
   - Look for error messages
   - Check configuration status

---

**Status:** Ready to update in Vercel dashboard
**Next Step:** Update the key, then test when ready to deploy

