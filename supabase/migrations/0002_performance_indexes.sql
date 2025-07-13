-- Performance indexes for better query performance
-- This migration adds indexes to improve query performance

-- User table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_region_id ON users(region_id);
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(verified);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Product table indexes
CREATE INDEX IF NOT EXISTS idx_products_seller_id ON products(seller_id);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_country ON products(country);
CREATE INDEX IF NOT EXISTS idx_products_region_id ON products(region_id);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_views ON products(views);

-- Spatial indexes for geographic queries
CREATE INDEX IF NOT EXISTS idx_users_coordinates ON users USING GIST(coordinates);
CREATE INDEX IF NOT EXISTS idx_products_coordinates ON products USING GIST(coordinates);

-- Chat and message indexes
CREATE INDEX IF NOT EXISTS idx_chats_buyer_id ON chats(buyer_id);
CREATE INDEX IF NOT EXISTS idx_chats_seller_id ON chats(seller_id);
CREATE INDEX IF NOT EXISTS idx_chats_product_id ON chats(product_id);
CREATE INDEX IF NOT EXISTS idx_chats_status ON chats(status);
CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at);

CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_status ON messages(status);

-- Market trends indexes
CREATE INDEX IF NOT EXISTS idx_market_trends_category_id ON market_trends(category_id);
CREATE INDEX IF NOT EXISTS idx_market_trends_country ON market_trends(country);
CREATE INDEX IF NOT EXISTS idx_market_trends_region_id ON market_trends(region_id);
CREATE INDEX IF NOT EXISTS idx_market_trends_created_at ON market_trends(created_at);
CREATE INDEX IF NOT EXISTS idx_market_trends_coordinates ON market_trends USING GIST(coordinates);

-- User ratings indexes
CREATE INDEX IF NOT EXISTS idx_user_ratings_rated_id ON user_ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rater_id ON user_ratings(rater_id);
CREATE INDEX IF NOT EXISTS idx_user_ratings_rating ON user_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_user_ratings_created_at ON user_ratings(created_at);

-- Operating areas indexes
CREATE INDEX IF NOT EXISTS idx_operating_areas_user_id ON operating_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_operating_areas_regions ON operating_areas USING GIN(regions);
CREATE INDEX IF NOT EXISTS idx_operating_areas_delivery_zones ON operating_areas USING GIST(delivery_zones);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_products_status_country_region ON products(status, country, region_id);
CREATE INDEX IF NOT EXISTS idx_products_category_status_created ON products(category_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chats_participants ON chats(buyer_id, seller_id);

-- Full-text search indexes for products
CREATE INDEX IF NOT EXISTS idx_products_title_search ON products USING GIN(to_tsvector('french', title));
CREATE INDEX IF NOT EXISTS idx_products_description_search ON products USING GIN(to_tsvector('french', description));

-- Add trigger to update last_message_at in chats when a new message is added
CREATE OR REPLACE FUNCTION update_chat_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chats 
    SET last_message_at = NEW.created_at,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.chat_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chat_last_message ON messages;
CREATE TRIGGER trigger_update_chat_last_message
    AFTER INSERT ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_chat_last_message();

-- Add function to calculate user ratings
CREATE OR REPLACE FUNCTION calculate_user_rating(user_uuid UUID)
RETURNS TABLE(avg_rating DECIMAL, total_ratings BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(AVG(rating::DECIMAL), 0) as avg_rating,
        COUNT(*) as total_ratings
    FROM user_ratings 
    WHERE rated_id = user_uuid;
END;
$$ LANGUAGE plpgsql;

-- Add function to get nearby products
CREATE OR REPLACE FUNCTION get_nearby_products(
    user_lat DECIMAL,
    user_lng DECIMAL,
    radius_km INTEGER DEFAULT 50,
    limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
    id UUID,
    title TEXT,
    price DECIMAL,
    distance_km DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.title,
        p.price,
        (ST_Distance(
            ST_GeogFromText('POINT(' || user_lng || ' ' || user_lat || ')'),
            ST_GeogFromText(ST_AsText(p.coordinates))
        ) / 1000)::DECIMAL as distance_km
    FROM products p
    WHERE p.status = 'active'
        AND p.coordinates IS NOT NULL
        AND ST_DWithin(
            ST_GeogFromText('POINT(' || user_lng || ' ' || user_lat || ')'),
            ST_GeogFromText(ST_AsText(p.coordinates)),
            radius_km * 1000
        )
    ORDER BY distance_km ASC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;