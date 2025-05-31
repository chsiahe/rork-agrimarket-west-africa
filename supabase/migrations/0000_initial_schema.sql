-- Enable necessary extensions
create extension if not exists "postgis";
create extension if not exists "pg_trgm";

-- Create custom types
create type user_role as enum ('farmer', 'buyer', 'cooperative', 'distributor', 'admin');
create type product_condition as enum ('new', 'fresh', 'used', 'needs_repair');
create type delivery_mode as enum ('local', 'regional', 'pickup');

-- Create tables
create table public.users (
  id uuid references auth.users(id) primary key,
  name text not null,
  email text not null unique,
  phone text,
  role user_role not null default 'buyer',
  avatar_url text,
  location_country text not null,
  location_region text not null,
  location_city text not null,
  location_coordinates geography(point),
  verified boolean not null default false,
  rating numeric(2,1) not null default 0,
  total_ratings integer not null default 0,
  total_sales integer not null default 0,
  total_purchases integer not null default 0,
  joined_at timestamp with time zone not null default now(),
  bio text,
  languages text[],
  social_media jsonb,
  business_info jsonb,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint rating_range check (rating >= 0 and rating <= 5)
);

create table public.operating_areas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  regions text[] not null,
  max_delivery_distance integer not null,
  delivery_zones text[] not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.users(id) on delete cascade,
  title text not null,
  description text not null,
  price numeric(10,2) not null,
  negotiable boolean not null default false,
  quantity numeric(10,2) not null,
  unit text not null,
  category text not null,
  condition product_condition not null,
  images text[] not null,
  location_country text not null,
  location_region text not null,
  location_city text not null,
  location_coordinates geography(point),
  availability_start_date timestamp with time zone not null,
  availability_end_date timestamp with time zone,
  availability_duration text,
  delivery_modes delivery_mode[] not null,
  delivery_free boolean not null default false,
  delivery_fees numeric(10,2),
  allow_calls boolean not null default true,
  views integer not null default 0,
  favorites integer not null default 0,
  inquiries integer not null default 0,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint positive_price check (price > 0),
  constraint positive_quantity check (quantity > 0)
);

create table public.chats (
  id uuid primary key default gen_random_uuid(),
  participants uuid[] not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),

  constraint two_participants check (array_length(participants, 1) = 2)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.chats(id) on delete cascade,
  sender_id uuid references public.users(id) on delete cascade,
  content text not null,
  read boolean not null default false,
  created_at timestamp with time zone not null default now()
);

create table public.market_trends (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  product_name text not null,
  category text not null,
  price numeric(10,2) not null,
  unit text not null,
  country text not null,
  region text not null,
  city text not null,
  created_at timestamp with time zone not null default now(),

  constraint positive_price check (price > 0)
);

create table public.user_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  rater_id uuid references public.users(id) on delete cascade,
  rating numeric(2,1) not null,
  comment text,
  created_at timestamp with time zone not null default now(),

  constraint rating_range check (rating >= 0 and rating <= 5),
  constraint no_self_rating check (user_id != rater_id)
);

-- Create indexes
create index users_location_idx on public.users using gist(location_coordinates);
create index products_location_idx on public.products using gist(location_coordinates);
create index products_title_description_idx on public.products using gin(to_tsvector('french', title || ' ' || description));
create index market_trends_product_location_idx on public.market_trends(product_name, category, country, region, city);

-- Create functions
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Create triggers
create trigger users_updated_at
  before update on public.users
  for each row
  execute function update_updated_at();

create trigger products_updated_at
  before update on public.products
  for each row
  execute function update_updated_at();

create trigger chats_updated_at
  before update on public.chats
  for each row
  execute function update_updated_at();

-- Create RLS policies
alter table public.users enable row level security;
alter table public.operating_areas enable row level security;
alter table public.products enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;
alter table public.market_trends enable row level security;
alter table public.user_ratings enable row level security;

-- Users policies
create policy "Users are viewable by everyone."
  on public.users for select
  using (true);

create policy "Users can update own profile."
  on public.users for update
  using (auth.uid() = id);

-- Operating areas policies
create policy "Operating areas are viewable by everyone."
  on public.operating_areas for select
  using (true);

create policy "Users can update own operating areas."
  on public.operating_areas for all
  using (auth.uid() = user_id);

-- Products policies
create policy "Products are viewable by everyone."
  on public.products for select
  using (true);

create policy "Users can manage own products."
  on public.products for all
  using (auth.uid() = seller_id);

-- Chats policies
create policy "Users can view own chats."
  on public.chats for select
  using (auth.uid() = any(participants));

create policy "Users can create chats."
  on public.chats for insert
  with check (auth.uid() = any(participants));

-- Messages policies
create policy "Users can view messages in their chats."
  on public.messages for select
  using (
    exists (
      select 1 from public.chats
      where id = messages.chat_id
      and auth.uid() = any(participants)
    )
  );

create policy "Users can send messages."
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Market trends policies
create policy "Market trends are viewable by everyone."
  on public.market_trends for select
  using (true);

create policy "Authenticated users can submit market trends."
  on public.market_trends for insert
  with check (auth.uid() = user_id);

-- User ratings policies
create policy "Ratings are viewable by everyone."
  on public.user_ratings for select
  using (true);

create policy "Authenticated users can create ratings."
  on public.user_ratings for insert
  with check (auth.uid() = rater_id);