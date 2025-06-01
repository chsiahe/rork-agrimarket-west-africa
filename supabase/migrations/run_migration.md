# Migration Execution Guide

## Quick Start

1. Open Supabase Dashboard → SQL Editor
2. Copy content from `0001_initial_schema.sql`
3. Click "Run"

## Verification Steps

```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Verify ENUMs
SELECT t.typname, e.enumlabel
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid;

-- Check RLS policies
SELECT tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public';

-- Verify triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public';
```

## Common Issues

### Missing PostGIS
```sql
CREATE EXTENSION IF NOT EXISTS "postgis";
```

### RLS Issues
```sql
-- Enable RLS for specific table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Add basic policy
CREATE POLICY "Allow all" ON table_name
    FOR ALL
    TO authenticated
    USING (true);
```

### Trigger Problems
```sql
-- Recreate trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Function body
END;
$$ LANGUAGE plpgsql;

-- Recreate trigger
DROP TRIGGER IF EXISTS trigger_name ON table_name;
CREATE TRIGGER trigger_name
    AFTER INSERT ON table_name
    FOR EACH ROW
    EXECUTE FUNCTION function_name();
```

## Data Recovery

If something goes wrong:

1. Check error messages
2. Fix specific issues
3. Rerun migration
4. If needed, restore from backup

## Best Practices

1. Always test in development
2. Backup before migration
3. Monitor logs during execution
4. Verify all components after migration