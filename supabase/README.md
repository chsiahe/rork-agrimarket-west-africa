# Supabase Database Setup

This directory contains the database migrations and configuration for the AgriConnect application.

## Database Schema Overview

The database is designed to support a comprehensive agricultural marketplace with the following key features:

### Core Tables

1. **Users** - User profiles with authentication integration
2. **Products** - Agricultural products and listings
3. **Categories** - Product categorization
4. **Countries/Regions** - Geographic reference data
5. **Chats/Messages** - Communication system
6. **Market Trends** - Price tracking and market data
7. **User Ratings** - User feedback and reputation system
8. **Operating Areas** - Delivery zones for sellers

### Key Features

- **Authentication**: Integrated with Supabase Auth
- **Geographic Support**: PostGIS for location-based features
- **Row Level Security**: Comprehensive RLS policies
- **Multi-language Support**: French/English content
- **Performance Optimized**: Indexes for common queries

## Environment Setup

Make sure your `.env` file contains the following variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Migration Files

### 0001_initial_schema.sql
- Creates all core tables and relationships
- Sets up Row Level Security policies
- Inserts initial reference data
- Creates triggers for user management

### 0002_performance_indexes.sql
- Adds performance indexes
- Creates utility functions
- Sets up full-text search capabilities

## Database Functions

### User Management
- `handle_new_user()` - Automatically creates user profiles on auth signup
- `calculate_user_rating()` - Calculates average user ratings

### Geographic Features
- `get_nearby_products()` - Finds products within a specified radius
- PostGIS spatial indexes for efficient location queries

### Chat System
- `update_chat_last_message()` - Updates chat timestamps automatically

## Row Level Security Policies

The database implements comprehensive RLS policies:

- **Users**: Can view all profiles, update own profile
- **Products**: Public read access for active products, sellers manage own
- **Chats/Messages**: Users can only access their own conversations
- **Reference Data**: Public read access, admin-only modifications

## User Roles

The system supports multiple user types:
- `buyer` - Regular buyers/consumers
- `farmer` - Individual farmers
- `cooperative` - Agricultural cooperatives
- `distributor` - Distribution companies
- `admin` - System administrators

## Geographic Data

The system includes:
- Country codes and names
- Regional divisions (initially focused on Senegal)
- Coordinate support for precise locations
- Delivery zone mapping

## Performance Considerations

- Spatial indexes for geographic queries
- Full-text search indexes for product discovery
- Composite indexes for common query patterns
- Optimized for mobile app usage patterns

## Development Notes

- All timestamps use TIMESTAMPTZ for timezone awareness
- JSONB fields for flexible metadata storage
- UUID primary keys for security and scalability
- Proper foreign key constraints and cascading deletes

## Running Migrations

To apply these migrations to your Supabase instance:

1. Copy the SQL content from each migration file
2. Run them in order in your Supabase SQL editor
3. Verify that all tables and policies are created correctly

## Testing the Setup

After running migrations, you can test the setup by:

1. Creating a test user through the auth system
2. Verifying the user profile is created automatically
3. Testing product creation and retrieval
4. Checking that RLS policies work correctly