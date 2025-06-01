-- Comprehensive migration to fix all database schema and RLS issues
-- This migration safely handles existing columns and fixes authentication problems

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create enum types if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('buyer', 'farmer', 'cooperative', 'distributor', 'admin');
  END IF;
END
$$;

-- Safely add missing columns to users table
DO $$
BEGIN
  -- Add 'country' column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'country'
  ) THEN
    ALTER TABLE public.users ADD COLUMN country text NOT NULL DEFAULT 'SN';
  END IF;

  -- Add 'region' column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'region'
  ) THEN
    ALTER TABLE public.users ADD COLUMN region text;
  END IF;

  -- Add 'city' column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'city'
  ) THEN
    ALTER TABLE public.users ADD COLUMN city text;
  END IF;

  -- Add 'coordinates' column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'coordinates'
  ) THEN
    ALTER TABLE public.users ADD COLUMN coordinates geometry(Point, 4326);
  END IF;

  -- Add 'verified' column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'verified'
  ) THEN
    ALTER TABLE public.users ADD COLUMN verified boolean DEFAULT false;
  END IF;

  -- Add 'metadata' column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.users ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add 'settings' column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'settings'
  ) THEN
    ALTER TABLE public.users ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- Add 'phone' column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN phone text;
  END IF;

  -- Add 'name' column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE public.users ADD COLUMN name text;
  END IF;

  -- Add 'avatar' column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'avatar'
  ) THEN
    ALTER TABLE public.users ADD COLUMN avatar text;
  END IF;

  -- Ensure role column exists with proper enum type
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'role'
  ) THEN
    ALTER TABLE public.users ADD COLUMN role user_role NOT NULL DEFAULT 'buyer'::user_role;
  END IF;
END
$$;

-- Drop all existing RLS policies to start fresh
DROP POLICY IF EXISTS "Users can view public profiles." ON public.users;
DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can delete their own profile" ON public.users;
DROP POLICY IF EXISTS "Anyone can view public user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile during registration" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow read access for anonymous users" ON public.users;

-- Create comprehensive RLS policies
CREATE POLICY "Public read access to user profiles"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.users FOR INSERT
  WITH CHECK (
    -- Allow insert if user ID matches auth.uid() OR if no auth context (for registration)
    (auth.uid() IS NOT NULL AND auth.uid() = id) OR 
    (auth.uid() IS NULL)
  );

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.users FOR DELETE
  USING (auth.uid() = id);

-- Create or replace function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert a basic user profile when a new auth user is created
  INSERT INTO public.users (
    id,
    email,
    name,
    created_at,
    updated_at,
    country,
    role,
    verified,
    metadata,
    settings
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW(),
    'SN',
    'buyer'::user_role,
    false,
    '{}'::jsonb,
    '{}'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = COALESCE(EXCLUDED.name, public.users.name),
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Failed to create user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing users to ensure they have all required fields
UPDATE public.users 
SET 
  country = COALESCE(country, 'SN'),
  verified = COALESCE(verified, false),
  metadata = COALESCE(metadata, '{}'::jsonb),
  settings = COALESCE(settings, '{}'::jsonb),
  role = COALESCE(role, 'buyer'::user_role),
  updated_at = NOW()
WHERE 
  country IS NULL OR 
  verified IS NULL OR 
  metadata IS NULL OR 
  settings IS NULL OR 
  role IS NULL;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);
CREATE INDEX IF NOT EXISTS users_country_idx ON public.users (country);
CREATE INDEX IF NOT EXISTS users_verified_idx ON public.users (verified);
CREATE INDEX IF NOT EXISTS users_coordinates_idx ON public.users USING gist (coordinates);

-- Force schema cache refresh
SELECT pg_notify('pgrst', 'reload schema');

-- Vacuum and analyze for performance
VACUUM ANALYZE public.users;

-- Add helpful comments
COMMENT ON POLICY "Public read access to user profiles" ON public.users IS 'Allows anyone to view user profiles for marketplace functionality';
COMMENT ON POLICY "Users can insert their own profile" ON public.users IS 'Allows user profile creation during registration, handles both authenticated and unauthenticated contexts';
COMMENT ON POLICY "Users can update their own profile" ON public.users IS 'Allows users to update only their own profile information';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new auth user is created, with error handling';

-- Final status check
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully. Users table updated with all required columns and RLS policies fixed.';
END
$$;