# Email Sender Configuration

## ✅ Made Configurable!

You can now use **any email address from a verified domain** in Resend. You don't have to use `hello@afrikoni.com`.

## 🎯 Quick Setup Options

### Option 1: Use Your Verified `blackvado` Domain (For Testing Now)

Since `blackvado` is already verified in Resend, you can use it immediately:

**Add to `.env` file:**
```env
VITE_EMAIL_FROM=hello@blackvado.com
VITE_EMAIL_FROM_NAME=Afrikoni
```

**Then restart your dev server:**
```bash
npm run dev
```

✅ **This will work immediately** - no domain verification needed!

### Option 2: Use `afrikoni.com` (For Production)

When you verify `afrikoni.com` in Resend:

**Add to `.env` file:**
```env
VITE_EMAIL_FROM=hello@afrikoni.com
VITE_EMAIL_FROM_NAME=Afrikoni
```

**Or leave it unset** - it defaults to `hello@afrikoni.com`

## 📋 Current Configuration

The email service now reads from environment variables:

- `VITE_EMAIL_FROM` - The email address (default: `hello@afrikoni.com`)
- `VITE_EMAIL_FROM_NAME` - The display name (default: `Afrikoni`)

## 🔄 How to Switch

1. **Update `.env` file** with the email you want to use
2. **Restart dev server** (Vite needs restart to pick up new env vars)
3. **Test** - emails will now come from the configured address

## ✅ Recommended: Use `blackvado` for Testing

Since `blackvado` is already verified, add this to `.env`:

```env
VITE_EMAIL_FROM=hello@blackvado.com
VITE_EMAIL_FROM_NAME=Afrikoni
```

Then restart the dev server and test - it should work immediately!

---

**Status:** ✅ Email sender is now configurable
**Next Step:** Add `VITE_EMAIL_FROM=hello@blackvado.com` to `.env` and restart dev server

