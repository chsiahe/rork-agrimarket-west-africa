-- Migration to fix authentication and RLS issues
-- This script addresses login errors and schema cache issues

-- First, ensure all required extensions are enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Drop existing problematic RLS policies
DROP POLICY IF EXISTS "Authenticated users can insert their own profile." ON public.users;
DROP POLICY IF EXISTS "Users can update own profile." ON public.users;
DROP POLICY IF EXISTS "Users can view public profiles." ON public.users;

-- Ensure the users table has all required columns with proper defaults
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
    AND table_name = 'settings' 
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
    -- Create enum type if it doesn't exist
    DO $enum$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('buyer', 'farmer', 'cooperative', 'distributor');
      END IF;
    END
    $enum$;
    
    ALTER TABLE public.users ADD COLUMN role user_role NOT NULL DEFAULT 'buyer'::user_role;
  END IF;
END
$$;

-- Create more permissive RLS policies for users table
CREATE POLICY "Anyone can view public user profiles"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile during registration"
  ON public.users FOR INSERT
  WITH CHECK (
    -- Allow insert if the user ID matches the authenticated user
    -- OR if this is during the registration process (no auth.uid() yet)
    (auth.uid() IS NULL AND id IS NOT NULL) OR 
    (auth.uid() = id)
  );

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
  ON public.users FOR DELETE
  USING (auth.uid() = id);

-- Create a function to handle user profile creation after auth signup
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
    verified
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NOW(),
    NOW(),
    'SN',
    'buyer'::user_role,
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile on auth signup
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
WHERE country IS NULL OR verified IS NULL OR metadata IS NULL OR settings IS NULL OR role IS NULL;

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';

-- Add comments for documentation
COMMENT ON POLICY "Anyone can view public user profiles" ON public.users IS 'Allows public access to user profiles for marketplace functionality';
COMMENT ON POLICY "Users can insert their own profile during registration" ON public.users IS 'Allows user profile creation during registration process';
COMMENT ON POLICY "Users can update their own profile" ON public.users IS 'Allows users to update their own profile information';
COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates user profile when new auth user is created';

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users (email);
CREATE INDEX IF NOT EXISTS users_role_idx ON public.users (role);
CREATE INDEX IF NOT EXISTS users_country_idx ON public.users (country);
CREATE INDEX IF NOT EXISTS users_verified_idx ON public.users (verified);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;