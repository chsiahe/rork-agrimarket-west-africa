-- Migration script to update the users table schema
-- This script adds missing columns if they don't exist

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
END
$$;

-- Update the schema cache by notifying Supabase (this is handled automatically by Supabase when migrations are run)
-- No additional action needed for schema cache update

COMMENT ON COLUMN public.users.country IS 'Country of the user, defaults to Senegal (SN)';
COMMENT ON COLUMN public.users.region IS 'Region or state of the user';
COMMENT ON COLUMN public.users.city IS 'City of the user';
COMMENT ON COLUMN public.users.coordinates IS 'Geographic coordinates of the user location';
COMMENT ON COLUMN public.users.verified IS 'Whether the user account is verified';
COMMENT ON COLUMN public.users.metadata IS 'Additional user data in JSON format';
COMMENT ON COLUMN public.users.settings IS 'User preferences and settings in JSON format';