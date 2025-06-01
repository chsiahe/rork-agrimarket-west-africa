# Database Migration Guide

## Overview

This repository contains the database schema and migrations for the AgriConnect marketplace platform.

### Key Files

- `0001_initial_schema.sql`: Complete database schema with tables, triggers, and policies

## Running Migrations

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy and paste the content of `0001_initial_schema.sql`
4. Click "Run"

## Schema Features

- User authentication and profiles
- Product listings and categories
- Chat system
- Market trends tracking
- User ratings
- Operating areas with PostGIS support
- Row Level Security (RLS)
- Automated triggers

## Troubleshooting

If you encounter errors:

1. Check that PostGIS extension is enabled
2. Verify that all ENUMs are created successfully
3. Ensure RLS policies are properly set
4. Verify trigger functions are created before triggers

## Best Practices

1. Always backup data before migrations
2. Test migrations in development first
3. Monitor trigger functions for errors
4. Keep track of RLS policies