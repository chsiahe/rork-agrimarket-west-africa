-- This script will drop all tables in the public schema
-- WARNING: This is a destructive operation and will delete all data

DO $$ 
BEGIN
  -- Drop all tables in the public schema
  EXECUTE (
    SELECT string_agg('DROP TABLE IF EXISTS ' || quote_ident(tablename) || ' CASCADE;', ' ')
    FROM pg_tables
    WHERE schemaname = 'public'
  );
END $$;

-- Optionally, drop all functions, types, and other objects if needed
DROP FUNCTION IF EXISTS public.calculate_user_rating(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;
DROP TYPE IF EXISTS public.product_condition CASCADE;
DROP TYPE IF EXISTS public.delivery_mode CASCADE;
DROP TYPE IF EXISTS public.chat_status CASCADE;
DROP TYPE IF EXISTS public.message_status CASCADE;

-- Recreate extensions if they were dropped
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";