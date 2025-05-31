-- Enable required extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- Create enum types
create type user_role as enum ('buyer', 'farmer', 'cooperative', 'distributor');
create type product_condition as enum ('new', 'fresh', 'used', 'needs_repair');
create type delivery_mode as enum ('local', 'regional', 'pickup');
create type chat_status as enum ('active', 'archived', 'blocked');
create type message_status as enum ('sent', 'delivered', 'read');

-- Create users table
create table public.users (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    email text unique not null,
    phone text,
    name text,
    avatar text,
    role user_role not null default 'buyer'::user_role,
    verified boolean default false,
    country text not null default 'SN',
    region text,
    city text,
    coordinates geometry(Point, 4326),
    metadata jsonb default '{}'::jsonb,
    settings jsonb default '{}'::jsonb
);

-- Create operating_areas table
create table public.operating_areas (
    id uuid primary key default uuid_generate_v4(),
    user_id uuid references public.users(id) on delete cascade not null,
    regions text[] not null default array[]::text[],
    max_delivery_distance integer default 50,
    delivery_zones geometry(MultiPolygon, 4326),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create products table
create table public.products (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    seller_id uuid references public.users(id) on delete cascade not null,
    title text not null,
    description text,
    category text not null,
    condition product_condition not null default 'fresh'::product_condition,
    price numeric not null,
    negotiable boolean default false,
    quantity numeric not null,
    unit text not null default 'kg',
    images text[] not null default array[]::text[],
    country text not null,
    region text not null,
    city text not null,
    coordinates geometry(Point, 4326),
    delivery_modes delivery_mode[] not null default array['pickup']::delivery_mode[],
    free_delivery boolean default true,
    delivery_fees numeric,
    allow_calls boolean default false,
    start_date date not null,
    end_date date,
    duration text,
    views integer default 0,
    status text default 'active',
    metadata jsonb default '{}'::jsonb
);

-- Create chats table
create table public.chats (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    product_id uuid references public.products(id) on delete set null,
    buyer_id uuid references public.users(id) on delete cascade not null,
    seller_id uuid references public.users(id) on delete cascade not null,
    status chat_status default 'active'::chat_status,
    last_message_at timestamp with time zone,
    metadata jsonb default '{}'::jsonb
);

-- Create messages table
create table public.messages (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    chat_id uuid references public.chats(id) on delete cascade not null,
    sender_id uuid references public.users(id) on delete cascade not null,
    content text not null,
    status message_status default 'sent'::message_status,
    metadata jsonb default '{}'::jsonb
);

-- Create market_trends table
create table public.market_trends (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references public.users(id) on delete set null,
    category text not null,
    product_name text,
    price numeric not null,
    unit text not null default 'kg',
    country text not null,
    region text not null,
    city text not null,
    coordinates geometry(Point, 4326),
    metadata jsonb default '{}'::jsonb
);

-- Create user_ratings table
create table public.user_ratings (
    id uuid primary key default uuid_generate_v4(),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    rater_id uuid references public.users(id) on delete cascade not null,
    rated_id uuid references public.users(id) on delete cascade not null,
    rating integer not null check (rating >= 1 and rating <= 5),
    comment text,
    metadata jsonb default '{}'::jsonb
);

-- Enable Row Level Security
alter table public.users enable row level security;
alter table public.operating_areas enable row level security;
alter table public.products enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.market_trends enable row level security;
alter table public.user_ratings enable row level security;

-- Create RLS Policies

-- Users policies
create policy "Users can view public profiles."
    on public.users for select
    using (true);

create policy "Users can update own profile."
    on public.users for update
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

-- Operating areas policies
create policy "Operating areas are viewable by everyone."
    on public.operating_areas for select
    using (true);

create policy "Users can update own operating areas."
    on public.operating_areas for all
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

-- Products policies
create policy "Products are viewable by everyone."
    on public.products for select
    using (true);

create policy "Users can manage own products."
    on public.products for all
    using ((select auth.uid()) = seller_id)
    with check ((select auth.uid()) = seller_id);

-- Chats policies
create policy "Users can view own chats."
    on public.chats for select
    using ((select auth.uid()) in (buyer_id, seller_id));

create policy "Users can create chats."
    on public.chats for insert
    with check ((select auth.uid()) = buyer_id);

-- Messages policies
create policy "Users can view messages in their chats."
    on public.messages for select
    using (
        exists (
            select 1 from public.chats
            where id = messages.chat_id
            and ((select auth.uid()) in (buyer_id, seller_id))
        )
    );

create policy "Users can send messages."
    on public.messages for insert
    with check (
        exists (
            select 1 from public.chats
            where id = chat_id
            and ((select auth.uid()) in (buyer_id, seller_id))
        )
        and (select auth.uid()) = sender_id
    );

-- Market trends policies
create policy "Market trends are viewable by everyone."
    on public.market_trends for select
    using (true);

create policy "Authenticated users can submit market trends."
    on public.market_trends for insert
    with check ((select auth.uid()) = user_id);

-- User ratings policies
create policy "Ratings are viewable by everyone."
    on public.user_ratings for select
    using (true);

create policy "Authenticated users can create ratings."
    on public.user_ratings for insert
    with check ((select auth.uid()) = rater_id);

-- Create indexes for better performance
create index users_email_idx on public.users (email);
create index users_coordinates_idx on public.users using gist (coordinates);
create index operating_areas_user_id_idx on public.operating_areas (user_id);
create index operating_areas_delivery_zones_idx on public.operating_areas using gist (delivery_zones);
create index products_seller_id_idx on public.products (seller_id);
create index products_category_idx on public.products (category);
create index products_coordinates_idx on public.products using gist (coordinates);
create index products_created_at_idx on public.products (created_at);
create index chats_product_id_idx on public.chats (product_id);
create index chats_buyer_id_idx on public.chats (buyer_id);
create index chats_seller_id_idx on public.chats (seller_id);
create index messages_chat_id_idx on public.messages (chat_id);
create index messages_sender_id_idx on public.messages (sender_id);
create index market_trends_category_idx on public.market_trends (category);
create index market_trends_product_name_idx on public.market_trends (product_name);
create index market_trends_coordinates_idx on public.market_trends using gist (coordinates);
create index user_ratings_rated_id_idx on public.user_ratings (rated_id);

-- Create functions for computed columns and triggers
create or replace function public.calculate_user_rating(user_uuid uuid)
returns numeric as $$
    select coalesce(round(avg(rating)::numeric, 1), 0)
    from public.user_ratings
    where rated_id = user_uuid;
$$ language sql stable;

-- Create trigger to update updated_at columns
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create trigger handle_users_updated_at
    before update on public.users
    for each row
    execute function public.handle_updated_at();

create trigger handle_operating_areas_updated_at
    before update on public.operating_areas
    for each row
    execute function public.handle_updated_at();

create trigger handle_products_updated_at
    before update on public.products
    for each row
    execute function public.handle_updated_at();

create trigger handle_chats_updated_at
    before update on public.chats
    for each row
    execute function public.handle_updated_at();