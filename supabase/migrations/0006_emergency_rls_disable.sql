-- Emergency migration to temporarily disable RLS for troubleshooting
-- Use this ONLY when you need immediate access to fix critical issues
-- Remember to re-enable RLS after fixing the problems

-- Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Update any problematic data
UPDATE public.users 
SET 
  country = 'SN' WHERE country IS NULL,
  verified = false WHERE verified IS NULL,
  metadata = '{}'::jsonb WHERE metadata IS NULL,
  settings = '{}'::jsonb WHERE settings IS NULL,
  role = 'buyer'::user_role WHERE role IS NULL,
  updated_at = NOW();

-- Create very permissive policies for immediate access
DROP POLICY IF EXISTS "Emergency full access" ON public.users;
CREATE POLICY "Emergency full access"
  ON public.users FOR ALL
  USING (true)
  WITH CHECK (true);

-- Re-enable RLS with permissive policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Force schema refresh
SELECT pg_notify('pgrst', 'reload schema');

RAISE NOTICE 'Emergency RLS policies applied. Remember to run a proper fix migration after resolving issues.';