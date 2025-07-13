# Database Migration Guide

## Prerequisites

1. **Create Supabase Project**
   - Go to https://supabase.com
   - Create a new project
   - Wait for setup to complete

2. **Enable Extensions**
   - Go to Database → Extensions
   - Enable `uuid-ossp` and `postgis`

3. **Update Environment Variables**
   - Copy values from Project Settings → API
   - Update your `.env` file

## Migration Steps

### Step 1: Run Initial Schema

1. Open Supabase Dashboard → SQL Editor
2. Copy content from `0001_initial_schema.sql`
3. Click "Run"
4. Wait for completion (may take 30-60 seconds)

### Step 2: Run Performance Indexes (Optional)

1. Copy content from `0002_performance_indexes.sql`
2. Click "Run"
3. Wait for completion

## Verification Steps

```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify initial data
SELECT 'countries' as table_name, COUNT(*) as count FROM countries
UNION ALL
SELECT 'regions', COUNT(*) FROM regions
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'units', COUNT(*) FROM units;

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Verify triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
```

## Troubleshooting

### Common Issues

#### 1. PostGIS Extension Error
```
ERROR: extension "postgis" is not available
```
**Solution:** Enable PostGIS in Database → Extensions

#### 2. Permission Denied
```
ERROR: permission denied for schema public
```
**Solution:** Use service role key, not anon key

#### 3. Function Already Exists
```
ERROR: function already exists
```
**Solution:** This is normal, migrations use `CREATE OR REPLACE`

#### 4. RLS Policy Conflicts
```
ERROR: policy already exists
```
**Solution:** Drop existing policies first:
```sql
DROP POLICY IF EXISTS "policy_name" ON table_name;
```

### Recovery Steps

If migration fails:

1. **Check the error message** in SQL Editor output
2. **Fix the specific issue** (usually extension or permission)
3. **Re-run the migration** (safe to run multiple times)
4. **Verify completion** using verification queries

### Manual Fixes

#### Enable PostGIS Manually
```sql
CREATE EXTENSION IF NOT EXISTS "postgis";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

#### Reset RLS Policies
```sql
-- Disable RLS temporarily
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view all profiles" ON users;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Recreate policies (copy from migration file)
```

## Testing the Setup

After successful migration:

### 1. Test Authentication
```sql
-- Check if auth trigger works
INSERT INTO auth.users (id, email) VALUES 
(gen_random_uuid(), 'test@example.com');

-- Verify user profile was created
SELECT * FROM users WHERE email = 'test@example.com';
```

### 2. Test Product Creation
```sql
-- Insert test product
INSERT INTO products (seller_id, title, price, category_id) 
VALUES (
    (SELECT id FROM users LIMIT 1),
    'Test Product',
    100.00,
    (SELECT id FROM categories LIMIT 1)
);
```

### 3. Test Geographic Features
```sql
-- Test nearby products function
SELECT * FROM get_nearby_products(14.6928, -17.4467, 50, 10);
```

## Success Indicators

✅ **All tables created** (11 main tables)
✅ **Reference data inserted** (countries, regions, categories, units)
✅ **RLS policies active** (check with verification queries)
✅ **Triggers working** (auth user creation)
✅ **Extensions enabled** (PostGIS, uuid-ossp)
✅ **Indexes created** (performance optimization)

## Next Steps

1. **Update your app's environment variables**
2. **Test user registration flow**
3. **Verify API endpoints work**
4. **Test geographic features** (if using location)
5. **Monitor performance** with real data

## Support

If you need help:

1. **Check Supabase logs** in Dashboard → Logs
2. **Review error messages** carefully
3. **Verify environment variables** are correct
4. **Ensure extensions are enabled**
5. **Test with simple queries first**