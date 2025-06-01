-- Safe Update Migration
-- This migration updates the database schema safely, checking for existing columns and fixing RLS policies

-- Enable required extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA extensions;

-- Add missing columns to users table safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country') THEN
    ALTER TABLE public.users ADD COLUMN country text NOT NULL DEFAULT 'SN';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'region') THEN
    ALTER TABLE public.users ADD COLUMN region text;
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'city') THEN
    ALTER TABLE public.users ADD COLUMN city text;
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'coordinates') THEN
    ALTER TABLE public.users ADD COLUMN coordinates geometry(Point, 4326);
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'metadata') THEN
    ALTER TABLE public.users ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb NOT NULL;
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'settings') THEN
    ALTER TABLE public.users ADD COLUMN settings jsonb DEFAULT '{}'::jsonb NOT NULL;
  END IF;
END
$$;

-- Update RLS policies for users table to fix login/registration issues
DROP POLICY IF EXISTS "users_select_own" ON public.users;
DROP POLICY IF EXISTS "users_insert_own" ON public.users;
DROP POLICY IF EXISTS "users_update_own" ON public.users;
DROP POLICY IF EXISTS "users_delete_own" ON public.users;

CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_delete_own" ON public.users FOR DELETE USING (auth.uid() = id);

-- Force schema cache refresh
SELECT pg_notify('pgrst', 'reload schema');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Schema update completed successfully!';
  RAISE NOTICE 'Missing columns added safely';
  RAISE NOTICE 'RLS policies updated for users table';
END
$$;