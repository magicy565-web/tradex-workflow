-- TradeX Supabase Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. PROFILES (extends auth.users)
-- ============================================
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  company_name text,
  company_name_en text,
  phone text,
  plan text default 'trial' check (plan in ('trial', 'pro', 'enterprise')),
  credits integer default 500,
  trial_ends_at timestamptz default (now() + interval '7 days'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- 2. SITES (generated websites)
-- ============================================
create table public.sites (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  company_name text not null,
  company_name_en text not null,
  subdomain text unique,
  products text[] default '{}',
  target_markets text[] default '{}',
  selling_points text,
  contact_email text,
  contact_whatsapp text,
  site_data jsonb default '{}',
  status text default 'draft' check (status in ('draft', 'generating', 'preview', 'published')),
  published_at timestamptz,
  visitors integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.sites enable row level security;

create policy "Users can view own sites"
  on public.sites for select
  using (auth.uid() = user_id);

create policy "Users can insert own sites"
  on public.sites for insert
  with check (auth.uid() = user_id);

create policy "Users can update own sites"
  on public.sites for update
  using (auth.uid() = user_id);

create policy "Users can delete own sites"
  on public.sites for delete
  using (auth.uid() = user_id);

-- ============================================
-- 3. INQUIRIES (RFQ submissions)
-- ============================================
create table public.inquiries (
  id uuid default gen_random_uuid() primary key,
  site_id uuid references public.sites(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  company_name text,
  contact_name text,
  email text,
  whatsapp text,
  product_type text,
  clamping_force text,
  application text,
  quantity text,
  port text,
  message text,
  status text default 'new' check (status in ('new', 'replied', 'quoted', 'closed')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.inquiries enable row level security;

create policy "Users can view own inquiries"
  on public.inquiries for select
  using (auth.uid() = user_id);

create policy "Users can update own inquiries"
  on public.inquiries for update
  using (auth.uid() = user_id);

-- Public insert for RFQ form submissions
create policy "Anyone can submit inquiries"
  on public.inquiries for insert
  with check (true);

-- ============================================
-- 4. LEADS (potential customers)
-- ============================================
create table public.leads (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  company_name text,
  contact_name text,
  email text,
  country text,
  source text,
  score integer default 0,
  status text default 'new' check (status in ('new', 'contacted', 'qualified', 'converted', 'lost')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.leads enable row level security;

create policy "Users can manage own leads"
  on public.leads for all
  using (auth.uid() = user_id);

-- ============================================
-- 5. CREDIT TRANSACTIONS (usage tracking)
-- ============================================
create table public.credit_transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  amount integer not null,
  action text not null,
  description text,
  created_at timestamptz default now()
);

alter table public.credit_transactions enable row level security;

create policy "Users can view own transactions"
  on public.credit_transactions for select
  using (auth.uid() = user_id);

-- Function to deduct credits
create or replace function public.deduct_credits(
  p_user_id uuid,
  p_amount integer,
  p_action text,
  p_description text default null
)
returns boolean as $$
declare
  current_credits integer;
begin
  select credits into current_credits
  from public.profiles
  where id = p_user_id;

  if current_credits < p_amount then
    return false;
  end if;

  update public.profiles
  set credits = credits - p_amount,
      updated_at = now()
  where id = p_user_id;

  insert into public.credit_transactions (user_id, amount, action, description)
  values (p_user_id, -p_amount, p_action, p_description);

  return true;
end;
$$ language plpgsql security definer;

-- ============================================
-- INDEXES
-- ============================================
create index idx_sites_user_id on public.sites(user_id);
create index idx_inquiries_site_id on public.inquiries(site_id);
create index idx_inquiries_user_id on public.inquiries(user_id);
create index idx_leads_user_id on public.leads(user_id);
create index idx_credit_transactions_user_id on public.credit_transactions(user_id);
