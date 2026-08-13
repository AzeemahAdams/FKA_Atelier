-- ============================================================
--  FKA ATELIER — Supabase Database Schema
--  Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── PROFILES ────────────────────────────────────────────────
-- Extends Supabase auth.users with customer-specific fields
create table if not exists public.profiles (
  id            uuid references auth.users(id) on delete cascade primary key,
  first_name    text,
  last_name     text,
  full_name     text generated always as (first_name || ' ' || last_name) stored,
  phone         text,
  addresses     jsonb    default '[]'::jsonb,
  preferences   jsonb    default '{}'::jsonb,
  order_count   integer  default 0,
  total_spend   numeric  default 0,
  last_order_at timestamptz,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Admin can read all profiles"  on public.profiles for select using (
  exists (select 1 from public.admin_users where id = auth.uid())
);
create policy "Admin can update all profiles" on public.profiles for update using (
  exists (select 1 from public.admin_users where id = auth.uid())
);

-- ── ADMIN_USERS ─────────────────────────────────────────────
-- Marks specific auth.users as admins
create table if not exists public.admin_users (
  id         uuid references auth.users(id) on delete cascade primary key,
  created_at timestamptz default now()
);
alter table public.admin_users enable row level security;
-- Only admins can read this table (used to verify admin status)
create policy "Admin can read admin_users" on public.admin_users for select using (auth.uid() = id);

-- ── PRODUCTS ────────────────────────────────────────────────
create table if not exists public.products (
  id             text primary key,  -- e.g. "fka-001"
  name           text not null,
  category       text not null,
  category_label text,
  price          numeric not null,
  price_formatted text,
  images         jsonb    default '[]'::jsonb,
  description    text,
  fabric         text,
  colours        jsonb    default '[]'::jsonb,
  sizes          jsonb    default '["XS","S","M","L","XL","XXL"]'::jsonb,
  care           text,
  available      boolean  default true,
  is_new         boolean  default false,
  is_bestseller  boolean  default false,
  collections    jsonb    default '[]'::jsonb,
  sort_order     integer  default 0,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

alter table public.products enable row level security;
-- Anyone can read available products
create policy "Anyone can read products"  on public.products for select using (true);
-- Only admins can insert/update/delete
create policy "Admin can manage products" on public.products for all using (
  exists (select 1 from public.admin_users where id = auth.uid())
);

-- ── DELIVERY_ZONES ──────────────────────────────────────────
create table if not exists public.delivery_zones (
  id              text primary key,
  name            text not null,
  description     text,
  keywords        jsonb    default '[]'::jsonb,
  state           text,
  fee             numeric  not null default 4500,
  free_threshold  numeric  default 70000,
  estimated_days  text,
  active          boolean  default true,
  is_default      boolean  default false,
  created_at      timestamptz default now(),
  updated_at      timestamptz default now()
);

alter table public.delivery_zones enable row level security;
create policy "Anyone can read delivery zones" on public.delivery_zones for select using (true);
create policy "Admin can manage delivery zones" on public.delivery_zones for all using (
  exists (select 1 from public.admin_users where id = auth.uid())
);

-- ── BOOKINGS ────────────────────────────────────────────────
-- Pre-payment order references (converted to orders after payment)
create table if not exists public.bookings (
  ref           text primary key,     -- e.g. "REF-123456"
  status        text not null default 'awaiting_payment',
                                       -- awaiting_payment | converted | cancelled
  customer_id   uuid,                  -- profiles.id (null if guest)
  account_id    uuid,                  -- auth.users.id
  customer_info jsonb not null,        -- snapshot: {fullName, email, phone}
  items         jsonb not null,        -- array of order items
  shipping_address jsonb not null,
  billing_address  jsonb,
  delivery_zone    jsonb,
  delivery_fee  numeric  default 0,
  subtotal      numeric  not null,
  total         numeric  not null,
  notes         text,
  order_id      text,                  -- filled after payment confirmed
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

alter table public.bookings enable row level security;
create policy "Users can read own bookings"  on public.bookings for select using (account_id = auth.uid());
create policy "Anyone can insert bookings"   on public.bookings for insert with check (true);
create policy "Admin can read all bookings"  on public.bookings for select using (
  exists (select 1 from public.admin_users where id = auth.uid())
);
create policy "Admin can update bookings"    on public.bookings for update using (
  exists (select 1 from public.admin_users where id = auth.uid())
);

-- ── ORDERS ──────────────────────────────────────────────────
create table if not exists public.orders (
  id               text primary key,   -- e.g. "FKA-ABC123"
  booking_ref      text references public.bookings(ref),
  customer_id      uuid,               -- profiles.id
  account_id       uuid,               -- auth.users.id
  customer_info    jsonb not null,     -- snapshot: {fullName, email, phone}
  items            jsonb not null,
  shipping_address jsonb not null,
  billing_address  jsonb,
  delivery_zone    jsonb,
  delivery_fee     numeric  default 0,
  subtotal         numeric  not null,
  total            numeric  not null,
  status           text     not null default 'confirmed',
  payment_status   text     not null default 'paid',
  payment_method   text     default 'bank_transfer',
  status_history   jsonb    default '[]'::jsonb,
  admin_notes      jsonb    default '[]'::jsonb,
  notes            text,
  confirmed_at     timestamptz default now(),
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.orders enable row level security;
create policy "Users can read own orders"  on public.orders for select using (account_id = auth.uid());
create policy "Admin can read all orders"  on public.orders for select using (
  exists (select 1 from public.admin_users where id = auth.uid())
);
create policy "Admin can manage orders"    on public.orders for all using (
  exists (select 1 from public.admin_users where id = auth.uid())
);

-- ── WISHLISTS ───────────────────────────────────────────────
create table if not exists public.wishlists (
  id          uuid default uuid_generate_v4() primary key,
  account_id  uuid references auth.users(id) on delete cascade not null,
  product_id  text not null,
  product_snapshot jsonb not null,  -- name, price, image, category at time of save
  added_at    timestamptz default now(),
  unique(account_id, product_id)
);

alter table public.wishlists enable row level security;
create policy "Users can read own wishlist"   on public.wishlists for select using (account_id = auth.uid());
create policy "Users can manage own wishlist" on public.wishlists for all    using (account_id = auth.uid());

-- ── ACTIVITY_LOG ────────────────────────────────────────────
create table if not exists public.activity_log (
  id         uuid default uuid_generate_v4() primary key,
  type       text not null,    -- new_booking, payment_confirmed, new_customer, etc.
  payload    jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.activity_log enable row level security;
create policy "Admin can read activity log" on public.activity_log for select using (
  exists (select 1 from public.admin_users where id = auth.uid())
);
create policy "Anyone can insert activity"  on public.activity_log for insert with check (true);

-- ── SETTINGS ────────────────────────────────────────────────
create table if not exists public.settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz default now()
);

alter table public.settings enable row level security;
create policy "Anyone can read settings"  on public.settings for select using (true);
create policy "Admin can manage settings" on public.settings for all using (
  exists (select 1 from public.admin_users where id = auth.uid())
);

-- ── REALTIME ────────────────────────────────────────────────
-- Enable realtime on the tables admin needs to watch live
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.bookings;
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.activity_log;
alter publication supabase_realtime add table public.products;

-- ── AUTO-UPDATE updated_at ──────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger trg_profiles_updated_at         before update on public.profiles         for each row execute procedure public.set_updated_at();
create trigger trg_products_updated_at         before update on public.products         for each row execute procedure public.set_updated_at();
create trigger trg_orders_updated_at           before update on public.orders           for each row execute procedure public.set_updated_at();
create trigger trg_bookings_updated_at         before update on public.bookings         for each row execute procedure public.set_updated_at();
create trigger trg_delivery_zones_updated_at   before update on public.delivery_zones   for each row execute procedure public.set_updated_at();

-- ── AUTO-CREATE PROFILE on signup ───────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, first_name, last_name, phone)
  values (
    new.id,
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone'
  );
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── SEED: Insert initial delivery zones ─────────────────────
insert into public.delivery_zones (id, name, description, keywords, state, fee, free_threshold, estimated_days, active, is_default)
values
  ('zone-lagos-island',   'Lagos Island',     'Victoria Island, Ikoyi, Lekki Phase 1',        '["lagos island","victoria island","vi","ikoyi","lekki phase 1","lekki 1","oniru","eti-osa"]',        'Lagos',      2500, 70000,  '1–2 business days', true,  false),
  ('zone-lagos-mainland', 'Lagos Mainland',   'Yaba, Surulere, Ikeja, Ojota, Agege',           '["yaba","surulere","ikeja","ojota","agege","maryland","mushin","oshodi","palmgrove","fadeyi","gbagada","pedro","bariga"]', 'Lagos', 3000, 70000, '1–2 business days', true, false),
  ('zone-lagos-outskirts','Lagos Outskirts',  'Ajah, Sangotedo, Ibeju-Lekki, Epe, Badagry',   '["ajah","sangotedo","ibeju","ibeju-lekki","epe","badagry","ikorodu","lekki phase 2","lekki 2","chevron","jakande"]', 'Lagos', 4000, 70000, '2–3 business days', true, false),
  ('zone-abuja',          'Abuja (FCT)',       'All areas within Abuja Federal Capital Territory','["abuja","fct","garki","wuse","maitama","asokoro","gwarinpa","kubwa","lugbe","life camp","jabi","utako","gudu","apo"]', 'FCT', 5500, 100000, '3–5 business days', true, false),
  ('zone-ph',             'Port Harcourt',    'Port Harcourt and surrounding Rivers areas',    '["port harcourt","ph","rivers","rumuola","woji","eliozu","ada george","trans amadi","diobu"]',       'Rivers',     6000, 100000, '3–5 business days', true,  false),
  ('zone-ibadan',         'Ibadan',           'Ibadan and surrounding Oyo State areas',        '["ibadan","oyo","ring road","challenge","bodija","agodi","jericho","ojoo","iwo road","mokola","dugbe"]', 'Oyo',      5000, 100000, '3–5 business days', true,  false),
  ('zone-south-west',     'South West',       'Abeokuta, Osogbo, Ado-Ekiti, Akure',           '["abeokuta","ogun","osogbo","osun","ado ekiti","ekiti","akure","ondo","ile-ife","ilorin","kwara","sagamu"]', 'South West', 5500, 100000, '4–6 business days', true, false),
  ('zone-south-east',     'South East',       'Enugu, Aba, Onitsha, Owerri, Awka',            '["enugu","aba","onitsha","owerri","umuahia","awka","anambra","imo","abia"]',                         'South East', 6500, 100000, '4–7 business days', true,  false),
  ('zone-south-south',    'South South',      'Benin City, Warri, Calabar, Uyo, Yenagoa',     '["benin","edo","warri","delta","calabar","cross river","uyo","akwa ibom","yenagoa","bayelsa"]',      'South South',6500, 100000, '4–7 business days', true,  false),
  ('zone-north',          'Northern Nigeria', 'Kano, Kaduna, Jos, Maiduguri, Sokoto',          '["kano","kaduna","jos","maiduguri","sokoto","zaria","katsina","bauchi","gombe","dutse","lafia","makurdi","minna","suleja"]', 'North', 7500, 150000, '5–8 business days', true, false),
  ('zone-default',        'Other Locations',  'All other Nigerian locations',                  '[]',                                                                                                   'Other',      8000, 150000, '5–10 business days',true,  true)
on conflict (id) do nothing;

-- Done!
-- Next steps:
-- 1. Create your admin user via Supabase Auth Dashboard (Authentication → Users → Invite user)
-- 2. Insert their UUID into public.admin_users:
--    INSERT INTO public.admin_users (id) VALUES ('paste-uuid-here');
-- 3. Seed products by running admin/products.html and saving each product,
--    OR insert them directly via the Supabase table editor.
