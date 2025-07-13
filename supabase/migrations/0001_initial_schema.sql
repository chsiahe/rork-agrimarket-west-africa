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

CREATE TABLE IF NOT EXISTS operating_areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    regions UUID[] DEFAULT ARRAY[]::UUID[],
    max_delivery_distance INTEGER DEFAULT 50,
    delivery_zones geometry(MultiPolygon, 4326),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category_id UUID REFERENCES categories(id),
    condition product_condition DEFAULT 'fresh',
    price DECIMAL(10,2),
    negotiable BOOLEAN DEFAULT false,
    quantity DECIMAL(12,3),
    unit_code TEXT REFERENCES units(code),
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    country CHAR(2) REFERENCES countries(code),
    region_id UUID REFERENCES regions(id),
    city TEXT,
    coordinates geometry(Point, 4326),
    delivery_modes delivery_mode[] DEFAULT ARRAY['pickup']::delivery_mode[],
    free_delivery BOOLEAN DEFAULT true,
    delivery_fees DECIMAL(8,2),
    allow_calls BOOLEAN DEFAULT false,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    views BIGINT DEFAULT 0,
    status product_status DEFAULT 'active',
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS chats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES users(id) ON DELETE CASCADE,
    seller_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status chat_status DEFAULT 'active',
    last_message_at TIMESTAMPTZ,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    status message_status DEFAULT 'sent',
    is_deleted BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS market_trends (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id),
    product_name TEXT,
    price DECIMAL(10,2),
    unit_code TEXT REFERENCES units(code),
    country CHAR(2) REFERENCES countries(code),
    region_id UUID REFERENCES regions(id),
    city TEXT,
    coordinates geometry(Point, 4326),
    metadata JSONB DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS user_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    rater_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rated_id UUID REFERENCES users(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    metadata JSONB DEFAULT '{}',
    UNIQUE(rater_id, rated_id)
);

-- Triggers
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    _role user_role;
BEGIN
    -- Safely convert role string to enum
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
        settings,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        NEW.raw_user_meta_data->>'phone',
        _role,
        COALESCE(NEW.raw_user_meta_data->>'country', 'SN'),
        false,
        NEW.raw_user_meta_data,
        '{}'::jsonb,
        NOW(),
        NOW()
    );

    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Handle duplicate email
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error and continue
        RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

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

CREATE POLICY "Reference data is modifiable by admins"
    ON countries FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    ));

CREATE POLICY "Reference data is modifiable by admins"
    ON regions FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    ));

CREATE POLICY "Reference data is modifiable by admins"
    ON categories FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    ));

CREATE POLICY "Reference data is modifiable by admins"
    ON units FOR ALL
    TO authenticated
    USING (EXISTS (
        SELECT 1 FROM users
        WHERE users.id = auth.uid()
        AND users.role = 'admin'
    ));

-- Core data policies
CREATE POLICY "Users can view all profiles"
    ON users FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile"
    ON users FOR UPDATE
    TO authenticated
    USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
    ON users FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view all active products"
    ON products FOR SELECT
    TO authenticated
    USING (status = 'active');

CREATE POLICY "Anonymous users can view active products"
    ON products FOR SELECT
    TO anon
    USING (status = 'active');

CREATE POLICY "Sellers can manage own products"
    ON products FOR ALL
    TO authenticated
    USING (auth.uid() = seller_id);

CREATE POLICY "Users can create products"
    ON products FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Users can view own chats"
    ON chats FOR SELECT
    TO authenticated
    USING (auth.uid() IN (buyer_id, seller_id));

CREATE POLICY "Users can create chats"
    ON chats FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Users can send messages in own chats"
    ON messages FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = chat_id
            AND auth.uid() IN (buyer_id, seller_id)
        )
    );

CREATE POLICY "Users can view messages in own chats"
    ON messages FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = chat_id
            AND auth.uid() IN (buyer_id, seller_id)
        )
    );

CREATE POLICY "Users can update messages in own chats"
    ON messages FOR UPDATE
    TO authenticated
    USING (
        sender_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM chats
            WHERE chats.id = chat_id
            AND auth.uid() IN (buyer_id, seller_id)
        )
    );

CREATE POLICY "Users can view own operating areas"
    ON operating_areas FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can manage own operating areas"
    ON operating_areas FOR ALL
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Users can view market trends"
    ON market_trends FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can submit market trends"
    ON market_trends FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view ratings"
    ON user_ratings FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create ratings"
    ON user_ratings FOR INSERT
    TO authenticated
    WITH CHECK (rater_id = auth.uid());

-- Insert initial data
INSERT INTO countries (code, name) VALUES 
    ('SN', 'Sénégal'),
    ('FR', 'France'),
    ('US', 'United States'),
    ('CA', 'Canada'),
    ('GB', 'United Kingdom'),
    ('DE', 'Germany'),
    ('ES', 'Spain'),
    ('IT', 'Italy'),
    ('BR', 'Brazil'),
    ('MX', 'Mexico')
ON CONFLICT DO NOTHING;

INSERT INTO regions (country, name)
VALUES 
    -- Senegal regions
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
    ('SN', 'Matam'),
    -- France regions (sample)
    ('FR', 'Île-de-France'),
    ('FR', 'Provence-Alpes-Côte d\'Azur'),
    ('FR', 'Auvergne-Rhône-Alpes'),
    ('FR', 'Nouvelle-Aquitaine'),
    ('FR', 'Occitanie'),
    -- US states (sample)
    ('US', 'California'),
    ('US', 'Texas'),
    ('US', 'Florida'),
    ('US', 'New York'),
    ('US', 'Illinois')
ON CONFLICT DO NOTHING;

INSERT INTO categories (label)
VALUES 
    ('Céréales'),
    ('Légumes'),
    ('Fruits'),
    ('Légumineuses'),
    ('Tubercules'),
    ('Épices et condiments'),
    ('Matériel agricole'),
    ('Semences'),
    ('Engrais et pesticides'),
    ('Bétail'),
    ('Volaille'),
    ('Produits laitiers'),
    ('Poissons et fruits de mer')
ON CONFLICT DO NOTHING;

INSERT INTO units (code, label)
VALUES 
    ('kg', 'Kilogramme'),
    ('g', 'Gramme'),
    ('t', 'Tonne'),
    ('l', 'Litre'),
    ('ml', 'Millilitre'),
    ('piece', 'Pièce'),
    ('sac', 'Sac'),
    ('caisse', 'Caisse'),
    ('botte', 'Botte'),
    ('panier', 'Panier')
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';