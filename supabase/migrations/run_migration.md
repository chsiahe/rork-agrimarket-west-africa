# How to Run Database Migrations

## Quick Fix for Current Issues

If you're experiencing login/registration errors, run this command in your Supabase SQL editor:

```sql
\i supabase/migrations/0005_comprehensive_fix.sql
```

## Migration Files Overview

### 0005_comprehensive_fix.sql ⭐ **RECOMMENDED**
- Fixes all current authentication and schema issues
- Safely adds missing columns
- Creates proper RLS policies
- Handles user registration flow
- **Use this for most issues**

### 0006_emergency_rls_disable.sql 🚨 **EMERGENCY ONLY**
- Temporarily disables RLS for immediate access
- Use only when you need urgent database access
- Remember to run a proper fix afterward

### 0007_production_ready_fix.sql 🏭 **PRODUCTION**
- Most comprehensive migration
- Handles all edge cases
- Production-ready with full error handling
- Use for clean, robust setup

## Step-by-Step Instructions

### For Current Login/Registration Errors:
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the content of `0005_comprehensive_fix.sql`
3. Click "Run"
4. Test your login/registration

### For Emergency Access:
1. Run `0006_emergency_rls_disable.sql` first
2. Fix your immediate issues
3. Then run `0005_comprehensive_fix.sql` to restore proper security

### For New Setup or Complete Fix:
1. Run `0007_production_ready_fix.sql`
2. This handles everything from scratch

## Common Commands

### Check if migration worked:
```sql
-- Check users table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check RLS policies
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- Test user creation
SELECT COUNT(*) as user_count FROM public.users;
```

### Force schema refresh:
```sql
SELECT pg_notify('pgrst', 'reload schema');
```

### Check for errors:
```sql
-- Check if all required columns exist
SELECT 
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country') 
    THEN 'country: ✅' 
    ELSE 'country: ❌' 
  END as country_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'settings') 
    THEN 'settings: ✅' 
    ELSE 'settings: ❌' 
  END as settings_status,
  CASE WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') 
    THEN 'role: ✅' 
    ELSE 'role: ❌' 
  END as role_status;
```

## Troubleshooting

### If you get "column already exists" error:
- The migration files use `IF NOT EXISTS` checks
- This error means the column exists but there might be a cache issue
- Run: `SELECT pg_notify('pgrst', 'reload schema');`

### If you get RLS policy violations:
- Run `0006_emergency_rls_disable.sql` for immediate access
- Then run `0005_comprehensive_fix.sql` for proper fix

### If authentication still fails:
- Check that the trigger is working: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Verify user creation function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`

## Best Practices

1. **Always backup** your data before running migrations
2. **Test on development** database first
3. **Run one migration at a time**
4. **Check the results** after each migration
5. **Use 0005_comprehensive_fix.sql** for most issues
6. **Use 0007_production_ready_fix.sql** for new setups

## Migration History

- `0005_comprehensive_fix.sql` - Fixes current auth/schema issues
- `0006_emergency_rls_disable.sql` - Emergency access (temporary)
- `0007_production_ready_fix.sql` - Complete production setup