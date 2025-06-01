-- Quick fixes migration for common issues
-- Run this when you encounter authentication or schema issues

-- Temporarily disable RLS to fix data issues
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Ensure all users have required fields
UPDATE public.users 
SET 
  country = 'SN' WHERE country IS NULL,
  verified = false WHERE verified IS NULL,
  metadata = '{}'::jsonb WHERE metadata IS NULL,
  settings = '{}'::jsonb WHERE settings IS NULL,
  role = 'buyer'::user_role WHERE role IS NULL,
  updated_at = NOW();

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop and recreate problematic policies
DROP POLICY IF EXISTS "Users can insert their own profile during registration" ON public.users;
DROP POLICY IF EXISTS "Anyone can view public user profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;

-- Create very permissive policies for testing
CREATE POLICY "Allow all operations for authenticated users"
  ON public.users FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow read access for anonymous users"
  ON public.users FOR SELECT
  TO anon
  USING (true);

-- Force schema cache refresh
SELECT pg_notify('pgrst', 'reload schema');

-- Vacuum and analyze for performance
VACUUM ANALYZE public.users;