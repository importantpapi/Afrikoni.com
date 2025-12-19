# Deployment Policy

## ⚠️ Important: Manual Deployment Only

**Do NOT deploy automatically to Vercel.**

### Workflow:
1. ✅ **Commit to GitHub** - Always allowed
2. ✅ **Push to GitHub** - Always allowed
3. ❌ **Deploy to Vercel** - **ONLY when explicitly requested**

### When to Deploy:
- ✅ User explicitly says "deploy" or "deploy to vercel"
- ✅ User asks to "push to production"
- ❌ NOT when just committing code
- ❌ NOT when fixing bugs
- ❌ NOT automatically after commits

### Standard Process:
1. Make code changes
2. Commit to GitHub
3. Push to GitHub
4. **Wait for user approval before deploying**

### To Deploy (when requested):
```bash
npx vercel --prod --yes
```

---

**Last Updated:** User requested manual deployment control

