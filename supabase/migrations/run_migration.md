# How to Run Database Migrations

## Quick Fix for Current Issues

If you're experiencing login/registration errors, run this command in your Supabase SQL editor:

```sql
\i supabase/migrations/0002_safe_update.sql
```

## Migration Files Overview

### 0002_safe_update.sql ⭐ **RECOMMENDED**
- Safely updates the database schema
- Adds missing columns with existence checks
- Fixes RLS policies for user login and registration
- **Use this for most issues**

## Step-by-Step Instructions

### For Current Login/Registration Errors:
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the content of `0002_safe_update.sql`
3. Click "Run"
4. Test your login/registration

### For New Setup or Complete Fix:
1. Run `0001_initial_setup.sql` if starting from scratch
2. Then run `0002_safe_update.sql` to ensure all updates are applied

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
- Run `0002_safe_update.sql` to update RLS policies

### If authentication still fails:
- Check that the trigger is working: `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
- Verify user creation function exists: `SELECT * FROM pg_proc WHERE proname = 'handle_new_user';`

## Best Practices

1. **Always backup** your data before running migrations
2. **Test on development** database first
3. **Run one migration at a time**
4. **Check the results** after each migration
5. **Use 0002_safe_update.sql** for most issues