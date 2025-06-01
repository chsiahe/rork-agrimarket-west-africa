-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create ENUM types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('buyer', 'farmer', 'cooperative', 'distributor', 'admin');
    CREATE TYPE product_condition AS ENUM ('new', 'fresh', 'used', 'needs_repair');
    CREATE TYPE delivery_mode AS ENUM ('local', 'regional', 'pickup');
    CREATE TYPE chat_status AS ENUM ('active', 'archived', 'blocked');
    CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
    CREATE TYPE product_status AS ENUM ('active', 'sold', 'archived', 'banned');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Reference tables
CREATE TABLE IF NOT EXISTS countries (
    code CHAR(2) PRIMARY KEY,
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS regions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country CHAR(2) REFERENCES countries(code),
    name TEXT NOT NULL,
    UNIQUE(country, name)
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS units (
    code TEXT PRIMARY KEY,
    label TEXT NOT NULL
);

-- Core tables
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'buyer',
    verified BOOLEAN DEFAULT false,
    country CHAR(2) REFERENCES countries(code),
    region_id UUID REFERENCES regions(id),
    city TEXT,
    coordinates geometry(Point, 4326),
    metadata JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}'
);

-- Other tables remain the same...

-- Triggers
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
    _role user_role;
BEGIN
    -- Get role from metadata or default to buyer
    BEGIN
        _role := (NEW.raw_user_meta_data->>'role')::user_role;
    EXCEPTION WHEN OTHERS THEN
        _role := 'buyer'::user_role;
    END;

    -- Insert new user profile
    INSERT INTO public.users (
        id,
        email,
        first_name,
        last_name,
        phone,
        role,
        country,
        verified,
        metadata,
        settings
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.raw_user_meta_data->>'phone',
        _role,
        'SN',
        false,
        NEW.raw_user_meta_data,
        '{}'::jsonb
    );

    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Handle duplicate email
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error and continue
        RAISE WARNING 'Error in handle_auth_user_created: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_auth_user_created();

DROP TRIGGER IF EXISTS set_updated_at ON users;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Enable RLS on all tables
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE regions ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE operating_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_ratings ENABLE ROW LEVEL SECURITY;

-- Reference data policies
CREATE POLICY "Reference data is readable by everyone"
    ON countries FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Reference data is readable by everyone"
    ON regions FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Reference data is readable by everyone"
    ON categories FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Reference data is readable by everyone"
    ON units FOR SELECT
    TO public
    USING (true);

-- Core data policies
CREATE POLICY "Users can view all profiles"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

-- Insert initial data
INSERT INTO countries (code, name) VALUES ('SN', 'Sénégal') ON CONFLICT DO NOTHING;

INSERT INTO regions (country, name)
VALUES 
    ('SN', 'Dakar'),
    ('SN', 'Thiès'),
    ('SN', 'Saint-Louis'),
    ('SN', 'Diourbel'),
    ('SN', 'Louga'),
    ('SN', 'Fatick'),
    ('SN', 'Kaolack'),
    ('SN', 'Kaffrine'),
    ('SN', 'Tambacounda'),
    ('SN', 'Kédougou'),
    ('SN', 'Kolda'),
    ('SN', 'Ziguinchor'),
    ('SN', 'Sédhiou'),
    ('SN', 'Matam')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';