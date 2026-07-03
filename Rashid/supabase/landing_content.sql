create table if not exists public.landing_content (
  id uuid primary key default gen_random_uuid(),
  section text not null,
  item_key text not null,
  icon text,
  title text,
  subtitle text,
  description text,
  button_text text,
  button_link text,
  image_url text,
  color_class text,
  sort_order integer default 0,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (section, item_key)
);

alter table public.landing_content enable row level security;

-- إذا لوحة الأدمن عندك تعتمد على تسجيل دخول Supabase للمدير، استخدم السياسات التالية.
-- إذا RLS معطل أو عندك سياسات عامة قديمة، ممكن تتركها كما هي.
drop policy if exists "landing content public read" on public.landing_content;
create policy "landing content public read"
on public.landing_content
for select
using (true);

drop policy if exists "landing content admin write" on public.landing_content;
create policy "landing content admin write"
on public.landing_content
for all
using (true)
with check (true);
