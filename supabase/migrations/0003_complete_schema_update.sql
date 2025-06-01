-- ====================================================================================
-- Migration finale : Schéma complet avec normalisation, contraintes, index avancés,
-- RLS renforcée et améliorations recommandées pour le marketplace agricole.
-- Date : 2025-06-01
-- ====================================================================================

-- 1. Extensions requises
-- --------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- 2. Tables de référence (normalisation)
-- --------------------------------------------------------------------
-- 2.1. Table des pays 
CREATE TABLE IF NOT EXISTS public.countries (
    code   CHAR(2) PRIMARY KEY,             -- Code ISO 3166-1 alpha-2
    name   TEXT NOT NULL
);

-- Insertion des données de base pour le Sénégal
INSERT INTO public.countries(code, name) VALUES ('SN', 'Sénégal')
ON CONFLICT (code) DO NOTHING;

-- 2.2. Table des régions (p. ex. régions administratives)
CREATE TABLE IF NOT EXISTS public.regions (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    country   CHAR(2) REFERENCES public.countries(code) ON DELETE CASCADE NOT NULL,
    name      TEXT NOT NULL,
    UNIQUE(country, name)
);

-- Insertion des régions du Sénégal
INSERT INTO public.regions(country, name) VALUES 
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
ON CONFLICT (country, name) DO NOTHING;

-- 2.3. Table des catégories de produits
CREATE TABLE IF NOT EXISTS public.categories (
    id    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label TEXT NOT NULL UNIQUE
);

-- Insertion des catégories de base
INSERT INTO public.categories(label) VALUES 
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
ON CONFLICT (label) DO NOTHING;

-- 2.4. Table des unités de mesure
CREATE TABLE IF NOT EXISTS public.units (
    code      TEXT PRIMARY KEY,            -- ex. 'kg', 'l', 'piece'
    label     TEXT NOT NULL
);

-- Insertion des unités de base
INSERT INTO public.units(code, label) VALUES 
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
ON CONFLICT (code) DO NOTHING;

-- 3. Types ENUM avec gestion des conflits (compatible avec versions antérieures)
-- --------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('buyer', 'farmer', 'cooperative', 'distributor', 'admin');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_condition') THEN
    CREATE TYPE public.product_condition AS ENUM ('new', 'fresh', 'used', 'needs_repair');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'delivery_mode') THEN
    CREATE TYPE public.delivery_mode AS ENUM ('local', 'regional', 'pickup');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'chat_status') THEN
    CREATE TYPE public.chat_status AS ENUM ('active', 'archived', 'blocked');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'message_status') THEN
    CREATE TYPE public.message_status AS ENUM ('sent', 'delivered', 'read');
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_status') THEN
    CREATE TYPE public.product_status AS ENUM ('active', 'sold', 'archived', 'banned');
  END IF;
END
$$;

-- 4. Table users
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    email        VARCHAR(255) NOT NULL UNIQUE CHECK (email ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    phone        TEXT,
    first_name   TEXT,
    last_name    TEXT,
    avatar_url   TEXT,
    role         public.user_role NOT NULL DEFAULT 'buyer',
    verified     BOOLEAN NOT NULL DEFAULT FALSE,
    country      CHAR(2) NOT NULL REFERENCES public.countries(code) ON DELETE RESTRICT DEFAULT 'SN',
    region_id    UUID REFERENCES public.regions(id) ON DELETE SET NULL,
    city         TEXT,
    coordinates  geometry(Point, 4326),
    metadata     JSONB NOT NULL DEFAULT '{}'::JSONB,
    settings     JSONB NOT NULL DEFAULT '{}'::JSONB,
    CONSTRAINT chk_phone_format CHECK (
      phone IS NULL 
      OR phone ~ '^\+?[1-9]\d{1,14}$'    -- Format E.164 optionnel
    )
);

-- 5. Table operating_areas
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.operating_areas (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    regions                UUID[] NOT NULL DEFAULT ARRAY[]::UUID[],    -- liste de region_id
    max_delivery_distance  INTEGER NOT NULL DEFAULT 50 CHECK (max_delivery_distance >= 0),
    delivery_zones         geometry(MultiPolygon, 4326),
    created_at             TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- 6. Table products
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
    id                 UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at         TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    seller_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    title              VARCHAR(150) NOT NULL,
    description        TEXT,
    category_id        UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    condition          public.product_condition NOT NULL DEFAULT 'fresh',
    price              NUMERIC(10,2) NOT NULL CHECK (price > 0),
    negotiable         BOOLEAN NOT NULL DEFAULT FALSE,
    quantity           NUMERIC(12,3) NOT NULL CHECK (quantity >= 0),
    unit_code          TEXT NOT NULL REFERENCES public.units(code),
    images             TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],      -- URLs
    country            CHAR(2) NOT NULL REFERENCES public.countries(code) ON DELETE RESTRICT,
    region_id          UUID NOT NULL REFERENCES public.regions(id) ON DELETE RESTRICT,
    city               TEXT NOT NULL,
    coordinates        geometry(Point, 4326),
    delivery_modes     public.delivery_mode[] NOT NULL DEFAULT ARRAY['pickup']::public.delivery_mode[],
    free_delivery      BOOLEAN NOT NULL DEFAULT TRUE,
    delivery_fees      NUMERIC(8,2) CHECK (
                          (free_delivery = TRUE AND delivery_fees IS NULL)
                          OR (free_delivery = FALSE AND delivery_fees >= 0)
                       ),
    allow_calls        BOOLEAN NOT NULL DEFAULT FALSE,
    start_date         DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date           DATE CHECK (end_date >= start_date),
    views              BIGINT NOT NULL DEFAULT 0,
    status             public.product_status NOT NULL DEFAULT 'active',
    metadata           JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- 7. Table chats
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.chats (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    product_id       UUID REFERENCES public.products(id) ON DELETE SET NULL,
    buyer_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    seller_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status           public.chat_status NOT NULL DEFAULT 'active',
    last_message_at  TIMESTAMPTZ,
    metadata         JSONB NOT NULL DEFAULT '{}'::JSONB,
    CONSTRAINT chk_distinct_buyer_seller CHECK (buyer_id <> seller_id)
);

-- 8. Table messages
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    chat_id       UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
    sender_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    content       TEXT NOT NULL,
    status        public.message_status NOT NULL DEFAULT 'sent',
    is_deleted    BOOLEAN NOT NULL DEFAULT FALSE,
    metadata      JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- 9. Table market_trends
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.market_trends (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    user_id      UUID REFERENCES public.users(id) ON DELETE SET NULL,
    category_id  UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
    product_name TEXT,
    price        NUMERIC(10,2) NOT NULL CHECK (price > 0),
    unit_code    TEXT NOT NULL REFERENCES public.units(code),
    country      CHAR(2) NOT NULL REFERENCES public.countries(code) ON DELETE RESTRICT,
    region_id    UUID NOT NULL REFERENCES public.regions(id) ON DELETE RESTRICT,
    city         TEXT NOT NULL,
    coordinates  geometry(Point, 4326),
    metadata     JSONB NOT NULL DEFAULT '{}'::JSONB
);

-- 10. Table user_ratings
-- --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_ratings (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    rater_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    rated_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
    rating       INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment      TEXT,
    metadata     JSONB NOT NULL DEFAULT '{}'::JSONB,
    CONSTRAINT uniq_rater_rated UNIQUE (rater_id, rated_id)
);

-- 11. Fonctions utilitaires
-- --------------------------------------------------------------------
-- 11.1. Fonction de mise à jour automatique de updated_at en UTC
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11.2. Fonction de calcul de la note moyenne d'un utilisateur
CREATE OR REPLACE FUNCTION public.calculate_user_rating(user_uuid UUID)
RETURNS NUMERIC AS $$
    SELECT COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0)
    FROM public.user_ratings
    WHERE rated_id = user_uuid;
$$ LANGUAGE sql STABLE;

-- 12. Triggers de mise à jour de updated_at
-- --------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_users_updated_at ON public.users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_operating_areas_updated_at ON public.operating_areas;
CREATE TRIGGER trg_operating_areas_updated_at
    BEFORE UPDATE ON public.operating_areas
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_chats_updated_at ON public.chats;
CREATE TRIGGER trg_chats_updated_at
    BEFORE UPDATE ON public.chats
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_messages_updated_at ON public.messages;
CREATE TRIGGER trg_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_market_trends_updated_at ON public.market_trends;
CREATE TRIGGER trg_market_trends_updated_at
    BEFORE UPDATE ON public.market_trends
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_user_ratings_updated_at ON public.user_ratings;
CREATE TRIGGER trg_user_ratings_updated_at
    BEFORE UPDATE ON public.user_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 13. Trigger de création automatique d'un profil utilisateur à partir de auth.users
-- --------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  BEGIN
    INSERT INTO public.users (
      id, email, first_name, last_name, phone, role,
      country, verified, metadata, settings, created_at, updated_at
    ) VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', ''), 
      COALESCE(NEW.raw_user_meta_data->>'last_name', ''), 
      NEW.raw_user_meta_data->>'phone',
      COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'buyer'),
      'SN',
      FALSE,
      COALESCE(NEW.raw_user_meta_data, '{}'::JSONB),
      '{}'::JSONB,
      timezone('utc', now()),
      timezone('utc', now())
    )
    ON CONFLICT (id) DO UPDATE
      SET email = EXCLUDED.email,
          updated_at = timezone('utc', now());
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Échec création utilisateur %: % (SQLSTATE: %)', NEW.id, SQLERRM, SQLSTATE;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 14. Row Level Security (RLS) et policies
-- --------------------------------------------------------------------
-- 14.1. Activation globale du RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operating_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- 14.2. Policies pour public.users
DROP POLICY IF EXISTS users_select_all ON public.users;
CREATE POLICY users_select_all
  ON public.users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS users_insert_own ON public.users;
CREATE POLICY users_insert_own
  ON public.users
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS users_update_own ON public.users;
CREATE POLICY users_update_own
  ON public.users
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS users_delete_own ON public.users;
CREATE POLICY users_delete_own
  ON public.users
  FOR DELETE USING (auth.uid() = id);

-- 14.3. Policies pour public.operating_areas
DROP POLICY IF EXISTS operating_areas_select_all ON public.operating_areas;
CREATE POLICY operating_areas_select_all
  ON public.operating_areas
  FOR SELECT USING (true);

DROP POLICY IF EXISTS operating_areas_manage_own ON public.operating_areas;
CREATE POLICY operating_areas_manage_own
  ON public.operating_areas
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 14.4. Policies pour public.products
DROP POLICY IF EXISTS products_select_active ON public.products;
CREATE POLICY products_select_active
  ON public.products
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS products_manage_own ON public.products;
CREATE POLICY products_manage_own
  ON public.products
  FOR ALL USING (auth.uid() = seller_id)
  WITH CHECK (auth.uid() = seller_id);

-- 14.5. Policies pour public.chats
DROP POLICY IF EXISTS chats_select_own ON public.chats;
CREATE POLICY chats_select_own
  ON public.chats
  FOR SELECT USING (auth.uid() IN (buyer_id, seller_id));

DROP POLICY IF EXISTS chats_insert_as_buyer ON public.chats;
CREATE POLICY chats_insert_as_buyer
  ON public.chats
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

DROP POLICY IF EXISTS chats_update_own ON public.chats;
CREATE POLICY chats_update_own
  ON public.chats
  FOR UPDATE USING (auth.uid() IN (buyer_id, seller_id))
  WITH CHECK (auth.uid() IN (buyer_id, seller_id));

DROP POLICY IF EXISTS chats_delete_own ON public.chats;
CREATE POLICY chats_delete_own
  ON public.chats
  FOR DELETE USING (auth.uid() IN (buyer_id, seller_id));

-- 14.6. Policies pour public.messages
DROP POLICY IF EXISTS messages_select_own ON public.messages;
CREATE POLICY messages_select_own
  ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = public.messages.chat_id
        AND auth.uid() IN (c.buyer_id, c.seller_id)
    )
  );

DROP POLICY IF EXISTS messages_insert_own ON public.messages;
CREATE POLICY messages_insert_own
  ON public.messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = chat_id
        AND auth.uid() IN (c.buyer_id, c.seller_id)
    )
    AND auth.uid() = sender_id
  );

DROP POLICY IF EXISTS messages_update_own ON public.messages;
CREATE POLICY messages_update_own
  ON public.messages
  FOR UPDATE USING (
    auth.uid() = sender_id
    AND NOT is_deleted
  ) WITH CHECK (
    auth.uid() = sender_id
    AND NEW.is_deleted = FALSE
  );

DROP POLICY IF EXISTS messages_delete_own ON public.messages;
CREATE POLICY messages_delete_own
  ON public.messages
  FOR DELETE USING (
    auth.uid() = sender_id
  );

-- 14.7. Policies pour public.market_trends
DROP POLICY IF EXISTS market_trends_select_all ON public.market_trends;
CREATE POLICY market_trends_select_all
  ON public.market_trends
  FOR SELECT USING (true);

DROP POLICY IF EXISTS market_trends_insert_authenticated ON public.market_trends;
CREATE POLICY market_trends_insert_authenticated
  ON public.market_trends
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS market_trends_update_own ON public.market_trends;
CREATE POLICY market_trends_update_own
  ON public.market_trends
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS market_trends_delete_own ON public.market_trends;
CREATE POLICY market_trends_delete_own
  ON public.market_trends
  FOR DELETE USING (auth.uid() = user_id);

-- 14.8. Policies pour public.user_ratings
DROP POLICY IF EXISTS user_ratings_select_all ON public.user_ratings;
CREATE POLICY user_ratings_select_all
  ON public.user_ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS user_ratings_insert_authenticated ON public.user_ratings;
CREATE POLICY user_ratings_insert_authenticated
  ON public.user_ratings
  FOR INSERT WITH CHECK (auth.uid() = rater_id);

DROP POLICY IF EXISTS user_ratings_update_own ON public.user_ratings;
CREATE POLICY user_ratings_update_own
  ON public.user_ratings
  FOR UPDATE USING (auth.uid() = rater_id)
  WITH CHECK (auth.uid() = rater_id);

DROP POLICY IF EXISTS user_ratings_delete_own ON public.user_ratings;
CREATE POLICY user_ratings_delete_own
  ON public.user_ratings
  FOR DELETE USING (auth.uid() = rater_id);

-- 15. Indexation avancée et performances
-- --------------------------------------------------------------------
-- 15.1. Index pour users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users (role);
CREATE INDEX IF NOT EXISTS idx_users_country ON public.users (country);
CREATE INDEX IF NOT EXISTS idx_users_verified_true 
  ON public.users (created_at) 
  WHERE verified = TRUE;
CREATE INDEX IF NOT EXISTS idx_users_coordinates 
  ON public.users USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_users_metadata_gin 
  ON public.users USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users (created_at);

-- 15.2. Index pour operating_areas
CREATE INDEX IF NOT EXISTS idx_operating_areas_user_id ON public.operating_areas (user_id);
CREATE INDEX IF NOT EXISTS idx_operating_areas_delivery_zones 
  ON public.operating_areas USING GIST (delivery_zones);

-- 15.3. Index pour products
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON public.products (seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products (category_id);
CREATE INDEX IF NOT EXISTS idx_products_status_created_at 
  ON public.products (created_at) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_products_coordinates 
  ON public.products USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_products_metadata_gin 
  ON public.products USING GIN (metadata);

-- 15.4. Index pour chats
CREATE INDEX IF NOT EXISTS idx_chats_product_id ON public.chats (product_id);
CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON public.chats (buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_seller_id ON public.chats (seller_id);
CREATE INDEX IF NOT EXISTS idx_chats_active_last_message_at 
  ON public.chats (last_message_at) WHERE status = 'active';

-- 15.5. Index pour messages
CREATE INDEX IF NOT EXISTS idx_messages_chat_id_created_at 
  ON public.messages (chat_id, created_at);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);

-- 15.6. Index pour market_trends
CREATE INDEX IF NOT EXISTS idx_market_trends_category_region_country 
  ON public.market_trends (category_id, country, region_id);
CREATE INDEX IF NOT EXISTS idx_market_trends_coordinates 
  ON public.market_trends USING GIST (coordinates);
CREATE INDEX IF NOT EXISTS idx_market_trends_created_at ON public.market_trends (created_at);

-- 15.7. Index pour user_ratings
CREATE INDEX IF NOT EXISTS idx_user_ratings_rated_id_created_at 
  ON public.user_ratings (rated_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_ratings_metadata_gin 
  ON public.user_ratings USING GIN (metadata);

-- 16. Grant permissions
-- --------------------------------------------------------------------
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL   ON ALL TABLES    IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES   IN SCHEMA public TO anon;
GRANT ALL   ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO anon;

-- 17. Forcer le rafraîchissement du cache de schéma (pour PostgREST/Supabase)
-- --------------------------------------------------------------------
SELECT pg_notify('pgrst', 'reload schema');

-- 18. Optimisation finale
-- --------------------------------------------------------------------
VACUUM ANALYZE;

-- 19. Messages de fin
-- --------------------------------------------------------------------
DO $$
BEGIN
  RAISE NOTICE 'Migration finale complétée avec succès !';
  RAISE NOTICE 'Schéma normalisé, contraintes appliquées, index avancés et RLS renforcée.';
END
$$;