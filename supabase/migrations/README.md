# Database Migrations Guide

## Migration Files

### 0001_initial_setup.sql
- Creates the initial database schema with all tables, types, and basic RLS policies
- Run this first when setting up a new database

### 0002_safe_update.sql
- **RECOMMENDED**: Safely updates the database schema
- Adds missing columns with existence checks
- Fixes RLS policies for user login and registration
- Run this to fix login/registration errors without resetting the database

## How to Use

### For Login/Registration Errors:
```sql
-- Run this migration to fix auth issues
\i supabase/migrations/0002_safe_update.sql
```

### For Complete Reset:
```sql
-- 1. Reset everything (DESTRUCTIVE)
\i supabase/migrations/0001_initial_setup.sql
```

## Common Issues and Solutions

### "Could not find column in schema cache"
- Run migration 0002_safe_update.sql
- This refreshes the schema cache

### "Row-level security policy violation"
- Run migration 0002_safe_update.sql to update RLS policies

### "User profile not found"
- Migration 0002_safe_update.sql ensures proper user table structure
- Login route now handles missing profiles gracefully

## Best Practices

1. Always backup your data before running migrations
2. Test migrations on a development database first
3. Run migrations in order (0001 → 0002 for updates)
4. Use 0002_safe_update.sql for most schema issues