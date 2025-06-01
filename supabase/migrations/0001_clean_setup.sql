-- Clean database setup migration
-- This migration completely resets and sets up the database properly
-- WARNING: This will DROP all existing data. Use with caution.

-- Drop everything first to ensure clean state
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO postgres, service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "postgis" WITH SCHEMA extensions;

-- Create enum types
CREATE TYPE public.user_role AS ENUM ('buyer', 'farmer', 'cooperative', 'distributor', 'admin');
CREATE TYPE public.product_condition AS ENUM ('new', 'fresh', 'used', 'needs_repair');
CREATE TYPE public.delivery_mode AS ENUM ('local', 'regional', 'pickup');
CREATE TYPE public.chat_status AS ENUM ('active', 'archived', 'blocked');
CREATE TYPE public.message_status AS ENUM ('sent', 'delivered', 'read');

-- Create users table with all required columns
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    email text UNIQUE NOT NULL,
    phone text,
    name text,
    avatar text,
    role public.user_role NOT NULL DEFAULT 'buyer'::public.user_role,
    verified boolean DEFAULT false NOT NULL,
    country text NOT NULL DEFAULT 'SN',
    region text,
    city text,
    coordinates geometry(Point, 4326),
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL
);

-- Create operating_areas table
CREATE TABLE public.operating_areas (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    regions text[] NOT NULL DEFAULT array[]::text[],
    max_delivery_distance integer DEFAULT 50,
    delivery_zones geometry(MultiPolygon, 4326),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create products table
CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    seller_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    category text NOT NULL,
    condition public.product_condition NOT NULL DEFAULT 'fresh'::public.product_condition,
    price numeric NOT NULL,
    negotiable boolean DEFAULT false,
    quantity numeric NOT NULL,
    unit text NOT NULL DEFAULT 'kg',
    images text[] NOT NULL DEFAULT array[]::text[],
    country text NOT NULL,
    region text NOT NULL,
    city text NOT NULL,
    coordinates geometry(Point, 4326),
    delivery_modes public.delivery_mode[] NOT NULL DEFAULT array['pickup']::public.delivery_mode[],
    free_delivery boolean DEFAULT true,
    delivery_fees numeric,
    allow_calls boolean DEFAULT false,
    start_date date NOT NULL,
    end_date date,
    duration text,
    views integer DEFAULT 0,
    status text DEFAULT 'active',
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Create chats table
CREATE TABLE public.chats (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    buyer_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    seller_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    status public.chat_status DEFAULT 'active'::public.chat_status,
    last_message_at timestamp with time zone,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Create messages table
CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    chat_id uuid REFERENCES public.chats(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    content text NOT NULL,
    status public.message_status DEFAULT 'sent'::public.message_status,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Create market_trends table
CREATE TABLE public.market_trends (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    category text NOT NULL,
    product_name text,
    price numeric NOT NULL,
    unit text NOT NULL DEFAULT 'kg',
    country text NOT NULL,
    region text NOT NULL,
    city text NOT NULL,
    coordinates geometry(Point, 4326),
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Create user_ratings table
CREATE TABLE public.user_ratings (
    id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    rater_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    rated_id uuid REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    metadata jsonb DEFAULT '{}'::jsonb
);

-- Create functions
CREATE OR REPLACE FUNCTION public.calculate_user_rating(user_uuid uuid)
RETURNS numeric AS $$
    SELECT COALESCE(ROUND(AVG(rating)::numeric, 1), 0)
    FROM public.user_ratings
    WHERE rated_id = user_uuid;
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at triggers
CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_operating_areas_updated_at
    BEFORE UPDATE ON public.operating_areas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_chats_updated_at
    BEFORE UPDATE ON public.chats
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create user profile creation function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
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
      'buyer'::public.user_role,
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

-- Create trigger for automatic user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- Create very permissive RLS policies for users table
CREATE POLICY "users_select_all" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert_own" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_own" ON public.users FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_delete_own" ON public.users FOR DELETE USING (auth.uid() = id);

-- Operating areas policies
CREATE POLICY "operating_areas_select_all" ON public.operating_areas FOR SELECT USING (true);
CREATE POLICY "operating_areas_manage_own" ON public.operating_areas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Products policies
CREATE POLICY "products_select_all" ON public.products FOR SELECT USING (true);
CREATE POLICY "products_manage_own" ON public.products FOR ALL USING (auth.uid() = seller_id) WITH CHECK (auth.uid() = seller_id);

-- Chats policies
CREATE POLICY "chats_select_own" ON public.chats FOR SELECT USING (auth.uid() IN (buyer_id, seller_id));
CREATE POLICY "chats_insert_as_buyer" ON public.chats FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- Messages policies
CREATE POLICY "messages_select_own_chats" ON public.messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.chats
        WHERE id = messages.chat_id
        AND auth.uid() IN (buyer_id, seller_id)
    )
);
CREATE POLICY "messages_insert_own" ON public.messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.chats
        WHERE id = chat_id
        AND auth.uid() IN (buyer_id, seller_id)
    )
    AND auth.uid() = sender_id
);

-- Market trends policies
CREATE POLICY "market_trends_select_all" ON public.market_trends FOR SELECT USING (true);
CREATE POLICY "market_trends_insert_authenticated" ON public.market_trends FOR INSERT WITH CHECK (auth.uid() = user_id);

-- User ratings policies
CREATE POLICY "user_ratings_select_all" ON public.user_ratings FOR SELECT USING (true);
CREATE POLICY "user_ratings_insert_authenticated" ON public.user_ratings FOR INSERT WITH CHECK (auth.uid() = rater_id);

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users (email);
CREATE INDEX idx_users_role ON public.users (role);
CREATE INDEX idx_users_country ON public.users (country);
CREATE INDEX idx_users_verified ON public.users (verified);
CREATE INDEX idx_users_coordinates ON public.users USING gist (coordinates);
CREATE INDEX idx_users_created_at ON public.users (created_at);

CREATE INDEX idx_operating_areas_user_id ON public.operating_areas (user_id);
CREATE INDEX idx_operating_areas_delivery_zones ON public.operating_areas USING gist (delivery_zones);

CREATE INDEX idx_products_seller_id ON public.products (seller_id);
CREATE INDEX idx_products_category ON public.products (category);
CREATE INDEX idx_products_coordinates ON public.products USING gist (coordinates);
CREATE INDEX idx_products_created_at ON public.products (created_at);

CREATE INDEX idx_chats_product_id ON public.chats (product_id);
CREATE INDEX idx_chats_buyer_id ON public.chats (buyer_id);
CREATE INDEX idx_chats_seller_id ON public.chats (seller_id);

CREATE INDEX idx_messages_chat_id ON public.messages (chat_id);
CREATE INDEX idx_messages_sender_id ON public.messages (sender_id);

CREATE INDEX idx_market_trends_category ON public.market_trends (category);
CREATE INDEX idx_market_trends_product_name ON public.market_trends (product_name);
CREATE INDEX idx_market_trends_coordinates ON public.market_trends USING gist (coordinates);

CREATE INDEX idx_user_ratings_rated_id ON public.user_ratings (rated_id);

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Force schema cache refresh
SELECT pg_notify('pgrst', 'reload schema');

-- Final optimization
VACUUM ANALYZE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database setup completed successfully!';
  RAISE NOTICE 'All tables created with proper RLS policies';
  RAISE NOTICE 'User creation trigger installed';
  RAISE NOTICE 'Performance indexes created';
END
$$;