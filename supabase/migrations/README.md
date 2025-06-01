# Database Migrations Guide

## Migration Files

### 0000_initial_schema.sql
- Creates the initial database schema with all tables, types, and basic RLS policies
- Run this first when setting up a new database

### 0001_reset_database.sql
- **DESTRUCTIVE**: Drops all tables and recreates extensions
- Use only when you need to completely reset the database

### 0002_update_users_schema.sql
- Adds missing columns to the users table safely
- Checks for column existence before adding

### 0003_fix_auth_and_rls.sql
- **RECOMMENDED**: Fixes authentication and RLS issues
- Creates more permissive policies for user registration/login
- Adds automatic user profile creation trigger
- Run this to fix login/registration errors

### 0004_quick_fixes.sql
- **EMERGENCY**: Quick fixes for immediate issues
- Temporarily disables RLS to fix data
- Creates very permissive policies for testing
- Use when you need immediate access

## How to Use

### For Login/Registration Errors:
```sql
-- Run this migration to fix auth issues
\i supabase/migrations/0003_fix_auth_and_rls.sql
```

### For Emergency Access:
```sql
-- Run this for immediate database access
\i supabase/migrations/0004_quick_fixes.sql
```

### For Complete Reset:
```sql
-- 1. Reset everything (DESTRUCTIVE)
\i supabase/migrations/0001_reset_database.sql

-- 2. Recreate schema
\i supabase/migrations/0000_initial_schema.sql

-- 3. Apply fixes
\i supabase/migrations/0003_fix_auth_and_rls.sql
```

## Common Issues and Solutions

### "Could not find column in schema cache"
- Run migration 0003_fix_auth_and_rls.sql
- This refreshes the schema cache

### "Row-level security policy violation"
- Run migration 0004_quick_fixes.sql for immediate access
- Then run migration 0003_fix_auth_and_rls.sql for proper fix

### "User profile not found"
- Migration 0003 adds automatic profile creation
- Login route now handles missing profiles gracefully

## Best Practices

1. Always backup your data before running migrations
2. Test migrations on a development database first
3. Run migrations in order (0000 → 0003 for new setup)
4. Use 0004 only for emergencies, then apply proper fixes