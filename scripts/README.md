# Scripts Directory

## Migration & Verification

### `quick-verify.sql`
Quick SQL queries to verify migration was applied. Run in Supabase SQL Editor.

### `verify-migration-complete.js`
Automated Node.js script to verify migration. Run with:
```bash
npm run verify-migration
```

### `apply-migration.sh`
Helper script with instructions for applying migration.

## Usage

1. **Apply Migration**: Use Supabase Dashboard SQL Editor
2. **Verify**: Run `npm run verify-migration` or use `quick-verify.sql`
3. **Test**: Follow `smoke-test-checklist.md`
