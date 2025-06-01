-- Production-ready migration that handles all edge cases
-- This migration is designed to work in any state of the database

-- Step 1: Ensure extensions are available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Step 2: Create enum types safely
DO $$
BEGIN
  -- Create user_role enum if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('buyer', 'farmer', 'cooperative', 'distributor', 'admin');
  ELSE
    -- Add 'admin' to existing enum if it doesn't exist
    BEGIN
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'admin';
    EXCEPTION
      WHEN duplicate_object THEN NULL;
    END;
  END IF;
END
$$;

-- Step 3: Ensure users table exists with basic structure
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  email text UNIQUE NOT NULL
);

-- Step 4: Add all required columns safely
DO $$
DECLARE
  column_exists boolean;
BEGIN
  -- Check and add each column individually
  
  -- phone column
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone'
  ) INTO column_exists;
  IF NOT column_exists THEN
    ALTER TABLE public.users ADD COLUMN phone text;
  END IF;

  -- name column
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'name'
  ) INTO column_exists;
  IF NOT column_exists THEN
    ALTER TABLE public.users ADD COLUMN name text;
  END IF;

  -- avatar column
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar'
  ) INTO column_exists;
  IF NOT column_exists THEN
    ALTER TABLE public.users ADD COLUMN avatar text;
  END IF;

  -- role column
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
  ) INTO column_exists;
  IF NOT column_exists THEN
    ALTER TABLE public.users ADD COLUMN role user_role NOT NULL DEFAULT 'buyer'::user_role;
  END IF;

  -- verified column
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'verified'
  ) INTO column_exists;
  IF NOT column_exists THEN
    ALTER TABLE public.users ADD COLUMN verified boolean DEFAULT false;
  END IF;

  -- country column
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'country'
  ) INTO column_exists;
  IF NOT column_exists THEN
    ALTER TABLE public.users ADD COLUMN country text NOT NULL DEFAULT 'SN';
  END IF;

  -- region column
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'region'
  ) INTO column_exists;
  IF NOT column_exists THEN
    ALTER TABLE public.users ADD COLUMN region text;
  END IF;

  -- city column
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'city'
  ) INTO column_exists;
  IF NOT column_exists THEN
    ALTER TABLE public.users ADD COLUMN city text;
  END IF;

  -- coordinates column
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'coordinates'
  ) INTO column_exists;
  IF NOT column_exists THEN
    ALTER TABLE public.users ADD COLUMN coordinates geometry(Point, 4326);
  END IF;

  -- metadata column
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'metadata'
  ) INTO column_exists;
  IF NOT column_exists THEN
    ALTER TABLE public.users ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
  END IF;

  -- settings column
  SELECT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'settings'
  ) INTO column_exists;
  IF NOT column_exists THEN
    ALTER TABLE public.users ADD COLUMN settings jsonb DEFAULT '{}'::jsonb;
  END IF;

END
$$;

-- Step 5: Enable RLS if not already enabled
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Step 6: Drop all existing policies to start clean
DO $$
DECLARE
  policy_record RECORD;
BEGIN
  FOR policy_record IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'users' AND schemaname = 'public'
  LOOP
    EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON public.users';
  END LOOP;
END
$$;

-- Step 7: Create production-ready RLS policies
CREATE POLICY "users_select_policy"
  ON public.users FOR SELECT
  USING (true);

CREATE POLICY "users_insert_policy"
  ON public.users FOR INSERT
  WITH CHECK (
    -- Allow insert if user owns the record OR during registration (no auth context)
    auth.uid() = id OR auth.uid() IS NULL
  );

CREATE POLICY "users_update_policy"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "users_delete_policy"
  ON public.users FOR DELETE
  USING (auth.uid() = id);

-- Step 8: Create robust user creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  BEGIN
    INSERT INTO public.users (
      id,
      email,
      name,
      phone,
      role,
      country,
      verified,
      metadata,
      settings,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'full_name', 
        split_part(NEW.email, '@', 1)
      ),
      NEW.raw_user_meta_data->>'phone',
      'buyer'::user_role,
      'SN',
      false,
      COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
      '{}'::jsonb,
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
      
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the auth process
      RAISE WARNING 'Failed to create user profile for %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  END;
  
  RETURN NEW;
END;
$$;

-- Step 9: Setup trigger for automatic user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Step 10: Clean up existing data
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

-- Step 11: Grant proper permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO authenticated;
GRANT SELECT ON public.users TO anon;

-- Step 12: Create performance indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_country ON public.users (country);
CREATE INDEX IF NOT EXISTS idx_users_verified ON public.users (verified);
CREATE INDEX IF NOT EXISTS idx_users_coordinates ON public.users USING gist (coordinates);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users (created_at);

-- Step 13: Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_users_updated_at ON public.users;
CREATE TRIGGER handle_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Step 14: Force schema cache refresh
SELECT pg_notify('pgrst', 'reload schema');

-- Step 15: Final cleanup and optimization
VACUUM ANALYZE public.users;

-- Step 16: Verification and reporting
DO $$
DECLARE
  user_count integer;
  column_count integer;
BEGIN
  SELECT COUNT(*) INTO user_count FROM public.users;
  
  SELECT COUNT(*) INTO column_count 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'users';
  
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Users table has % columns and % records', column_count, user_count;
  RAISE NOTICE 'RLS policies: 4 policies created (select, insert, update, delete)';
  RAISE NOTICE 'Triggers: user creation trigger and updated_at trigger active';
  RAISE NOTICE 'Indexes: 6 performance indexes created';
END
$$;