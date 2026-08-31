create extension if not exists pgcrypto;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create table if not exists public.portfolio_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  tags text[] not null default '{}',
  description_zh text not null default '',
  cover_url text not null default '',
  prototype_url text not null default '',
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  category text not null,
  date_label text not null default '',
  read_time text not null default '',
  summary text not null default '',
  source_url text not null default '',
  source_label text not null default '',
  blocks jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id text primary key default 'main',
  about_text text not null default '',
  contact_intro text not null default '',
  email text not null default '',
  location text not null default '',
  wechat text not null default '',
  work_hours text not null default '',
  xiaohongshu_url text not null default '',
  wechat_qr_url text not null default '',
  consultation_content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.navigation_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  href text not null,
  sort_order integer not null default 0,
  published boolean not null default true,
  open_new_tab boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists navigation_items_sort_order_idx
on public.navigation_items (sort_order, created_at);

alter table public.portfolio_admins enable row level security;
alter table public.projects enable row level security;
alter table public.articles enable row level security;
alter table public.site_settings enable row level security;
alter table public.navigation_items enable row level security;

create or replace function private.is_portfolio_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.portfolio_admins
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_portfolio_admin() from public;
grant execute on function private.is_portfolio_admin() to anon, authenticated;

drop policy if exists "Public reads published projects" on public.projects;
create policy "Public reads published projects"
on public.projects
for select
to anon, authenticated
using (published or (select private.is_portfolio_admin()));

drop policy if exists "Admins manage projects" on public.projects;
create policy "Admins manage projects"
on public.projects
for all
to authenticated
using ((select private.is_portfolio_admin()))
with check ((select private.is_portfolio_admin()));

drop policy if exists "Public reads published articles" on public.articles;
create policy "Public reads published articles"
on public.articles
for select
to anon, authenticated
using (published or (select private.is_portfolio_admin()));

drop policy if exists "Admins manage articles" on public.articles;
create policy "Admins manage articles"
on public.articles
for all
to authenticated
using ((select private.is_portfolio_admin()))
with check ((select private.is_portfolio_admin()));

drop policy if exists "Public reads site settings" on public.site_settings;
create policy "Public reads site settings"
on public.site_settings
for select
to anon, authenticated
using (true);

drop policy if exists "Admins manage site settings" on public.site_settings;
create policy "Admins manage site settings"
on public.site_settings
for all
to authenticated
using ((select private.is_portfolio_admin()))
with check ((select private.is_portfolio_admin()));

drop policy if exists "Public reads published navigation" on public.navigation_items;
create policy "Public reads published navigation"
on public.navigation_items
for select
to anon, authenticated
using (published or (select private.is_portfolio_admin()));

drop policy if exists "Admins manage navigation" on public.navigation_items;
create policy "Admins manage navigation"
on public.navigation_items
for all
to authenticated
using ((select private.is_portfolio_admin()))
with check ((select private.is_portfolio_admin()));

grant usage on schema public to anon, authenticated;
grant select on public.projects, public.articles, public.site_settings to anon, authenticated;
grant insert, update, delete on public.projects, public.articles, public.site_settings to authenticated;
grant select on public.navigation_items to anon, authenticated;
grant insert, update, delete on public.navigation_items to authenticated;
revoke all on public.portfolio_admins from anon, authenticated;

insert into public.navigation_items (id, label, href, sort_order, published, open_new_tab)
values
  ('10000000-0000-4000-8000-000000000001', '首页', '#top', 0, true, false),
  ('10000000-0000-4000-8000-000000000002', '作品集', './portfolio/index.html', 1, true, false),
  ('10000000-0000-4000-8000-000000000005', '练习与演示', './demos/index.html', 2, true, false),
  ('10000000-0000-4000-8000-000000000003', '文章', './articles/index.html', 3, true, false),
  ('10000000-0000-4000-8000-000000000004', '联系', '#contact', 4, true, false),
  ('10000000-0000-4000-8000-000000000006', '咨询', './consultation/index.html', 5, true, false)
on conflict (id) do update set
  label = excluded.label,
  href = excluded.href,
  sort_order = excluded.sort_order,
  published = excluded.published,
  open_new_tab = excluded.open_new_tab;


insert into storage.buckets (id, name, public)
values ('portfolio-media', 'portfolio-media', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public reads portfolio media" on storage.objects;
create policy "Public reads portfolio media"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'portfolio-media');

drop policy if exists "Admins upload portfolio media" on storage.objects;
create policy "Admins upload portfolio media"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'portfolio-media'
  and (select private.is_portfolio_admin())
);

drop policy if exists "Admins update portfolio media" on storage.objects;
create policy "Admins update portfolio media"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'portfolio-media'
  and (select private.is_portfolio_admin())
)
with check (
  bucket_id = 'portfolio-media'
  and (select private.is_portfolio_admin())
);

drop policy if exists "Admins delete portfolio media" on storage.objects;
create policy "Admins delete portfolio media"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'portfolio-media'
  and (select private.is_portfolio_admin())
);


create table if not exists public.site_events (
  id bigint generated always as identity primary key,
  event_name text not null check (event_name in ('page_view', 'content_click', 'contact_submit', 'ai_open')),
  path text not null default '/' check (char_length(path) between 1 and 500),
  content_type text check (content_type is null or char_length(content_type) <= 40),
  content_id text check (content_id is null or char_length(content_id) <= 160),
  referrer_host text check (referrer_host is null or char_length(referrer_host) <= 255),
  session_id text not null check (char_length(session_id) between 8 and 80),
  device_type text not null default 'desktop' check (device_type in ('desktop', 'tablet', 'mobile')),
  ip_address inet,
  country_code text check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  region text check (region is null or char_length(region) <= 100),
  city text check (city is null or char_length(city) <= 100),
  user_agent text check (user_agent is null or char_length(user_agent) <= 500),
  created_at timestamptz not null default now()
);

alter table public.site_events
  add column if not exists ip_address inet,
  add column if not exists country_code text,
  add column if not exists region text,
  add column if not exists city text,
  add column if not exists user_agent text;

create index if not exists site_events_created_at_idx
on public.site_events (created_at desc);

create index if not exists site_events_event_name_idx
on public.site_events (event_name, created_at desc);

create table if not exists public.ai_profile (
  id text primary key default 'main',
  enabled boolean not null default false,
  display_name text not null default 'Lin 的设计助手',
  greeting text not null default '你好，我可以介绍 Lin 的项目、经验和合作方式。',
  introduction text not null default '',
  skills text[] not null default '{}',
  suggested_questions jsonb not null default '[]'::jsonb,
  knowledge_base jsonb not null default '[]'::jsonb,
  fallback_message text not null default '这个问题我暂时没有准确答案，你可以通过页面底部的联系方式直接联系 Lin。',
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(suggested_questions) = 'array'),
  check (jsonb_typeof(knowledge_base) = 'array')
);

create table if not exists public.contact_inquiries (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  contact text not null check (char_length(contact) between 3 and 160),
  project_type text not null default '其他' check (char_length(project_type) between 1 and 80),
  message text not null check (char_length(message) between 5 and 2000),
  status text not null default 'new' check (status in ('new', 'read', 'replied', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists contact_inquiries_status_idx
on public.contact_inquiries (status, created_at desc);

create table if not exists public.finance_entries (
  id uuid primary key default gen_random_uuid(),
  entry_type text not null check (entry_type in ('income', 'expense')),
  title text not null check (char_length(title) between 1 and 120),
  category text not null default '其他' check (char_length(category) between 1 and 80),
  amount_cents bigint not null check (amount_cents >= 0),
  occurred_on date not null default current_date,
  note text not null default '' check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists finance_entries_occurred_on_idx
on public.finance_entries (occurred_on desc, created_at desc);

alter table public.site_events enable row level security;
alter table public.ai_profile enable row level security;
alter table public.contact_inquiries enable row level security;
alter table public.finance_entries enable row level security;

drop policy if exists "Public records safe site events" on public.site_events;

drop policy if exists "Admins read and delete site events" on public.site_events;
create policy "Admins read and delete site events"
on public.site_events
for select
to authenticated
using ((select private.is_portfolio_admin()));

drop policy if exists "Admins delete site events" on public.site_events;
create policy "Admins delete site events"
on public.site_events
for delete
to authenticated
using ((select private.is_portfolio_admin()));

drop policy if exists "Public reads enabled AI profile" on public.ai_profile;
create policy "Public reads enabled AI profile"
on public.ai_profile
for select
to anon, authenticated
using (enabled or (select private.is_portfolio_admin()));

drop policy if exists "Admins manage AI profile" on public.ai_profile;
create policy "Admins manage AI profile"
on public.ai_profile
for all
to authenticated
using ((select private.is_portfolio_admin()))
with check ((select private.is_portfolio_admin()));

drop policy if exists "Public submits inquiries" on public.contact_inquiries;
create policy "Public submits inquiries"
on public.contact_inquiries
for insert
to anon, authenticated
with check (
  status = 'new'
  and char_length(name) between 1 and 80
  and char_length(contact) between 3 and 160
  and char_length(project_type) between 1 and 80
  and char_length(message) between 5 and 2000
);

drop policy if exists "Admins manage inquiries" on public.contact_inquiries;
create policy "Admins manage inquiries"
on public.contact_inquiries
for all
to authenticated
using ((select private.is_portfolio_admin()))
with check ((select private.is_portfolio_admin()));

drop policy if exists "Admins manage finance entries" on public.finance_entries;
create policy "Admins manage finance entries"
on public.finance_entries
for all
to authenticated
using ((select private.is_portfolio_admin()))
with check ((select private.is_portfolio_admin()));

grant select, delete on public.site_events to authenticated;

grant select on public.ai_profile to anon, authenticated;
grant insert, update, delete on public.ai_profile to authenticated;

grant insert on public.contact_inquiries to anon, authenticated;
grant select, update, delete on public.contact_inquiries to authenticated;

grant select, insert, update, delete on public.finance_entries to authenticated;

insert into public.ai_profile (
  id,
  enabled,
  display_name,
  greeting,
  introduction,
  skills,
  suggested_questions,
  knowledge_base,
  fallback_message
)
values (
  'main',
  true,
  'Lin 的设计助手',
  '你好，我可以介绍 Lin 的项目、设计经验和合作方式。',
  '拥有 5 年以上多端 UI/UX 体验设计经验，具备 B 端 SaaS 系统与 C 端移动产品设计实战积累。',
  array['UI/UX 设计', 'B 端 SaaS', '移动产品', '数据可视化'],
  '["Lin 擅长哪些设计方向？", "有哪些代表项目？", "如何联系合作？"]'::jsonb,
  '[
    {"keywords":["擅长","能力","方向","技能"],"answer":"Lin 擅长多端 UI/UX、B 端 SaaS、C 端移动产品与数据可视化设计。"},
    {"keywords":["项目","作品","案例"],"answer":"你可以在作品集查看智慧换电、GoMenu 餐饮系统、ATN 数据看板等项目。"},
    {"keywords":["联系","合作","邮箱","微信"],"answer":"可以通过页面底部联系方式或项目咨询表单联系 Lin。"}
  ]'::jsonb,
  '这个问题我暂时没有准确答案，你可以通过页面底部的联系方式直接联系 Lin。'
)
on conflict (id) do nothing;

-- Video reference feature parity (2026-08-18)
alter table public.projects
  add column if not exists item_type text not null default 'portfolio',
  add column if not exists gallery jsonb not null default '[]'::jsonb,
  add column if not exists content_blocks jsonb not null default '[]'::jsonb,
  add column if not exists media_url text not null default '',
  add column if not exists client_name text not null default '',
  add column if not exists project_date date,
  add column if not exists password_enabled boolean not null default false;

alter table public.projects drop constraint if exists projects_item_type_check;
alter table public.projects
  add constraint projects_item_type_check check (item_type in ('portfolio', 'demo'));

alter table public.projects drop constraint if exists projects_gallery_check;
alter table public.projects
  add constraint projects_gallery_check check (jsonb_typeof(gallery) = 'array');

alter table public.projects drop constraint if exists projects_content_blocks_check;
alter table public.projects
  add constraint projects_content_blocks_check check (jsonb_typeof(content_blocks) = 'array');

create table if not exists public.project_access (
  project_slug text primary key references public.projects(slug) on update cascade on delete cascade,
  target_url text not null check (char_length(target_url) between 1 and 2000),
  password_hash text not null,
  updated_at timestamptz not null default now()
);

alter table public.project_access enable row level security;

drop policy if exists "Admins manage project access" on public.project_access;
create policy "Admins manage project access"
on public.project_access
for all
to authenticated
using ((select private.is_portfolio_admin()))
with check ((select private.is_portfolio_admin()));

grant select, insert, update, delete on public.project_access to authenticated;
revoke all on public.project_access from anon;

create or replace function public.verify_project_access(p_project_slug text, p_password text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select access.target_url
  from public.project_access as access
  join public.projects as project on project.slug = access.project_slug
  where access.project_slug = p_project_slug
    and project.published = true
    and project.password_enabled = true
    and access.password_hash = extensions.crypt(p_password, access.password_hash)
  limit 1;
$$;

revoke all on function public.verify_project_access(text, text) from public;
grant execute on function public.verify_project_access(text, text) to anon, authenticated;

create or replace function public.set_project_access(p_project_slug text, p_target_url text, p_password text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_portfolio_admin() then
    raise exception 'not authorized';
  end if;

  if coalesce(p_target_url, '') = '' or coalesce(p_password, '') = '' then
    delete from public.project_access where project_access.project_slug = p_project_slug;
    return;
  end if;

  insert into public.project_access (project_slug, target_url, password_hash, updated_at)
  values (
    p_project_slug,
    p_target_url,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    now()
  )
  on conflict (project_slug) do update set
    target_url = excluded.target_url,
    password_hash = excluded.password_hash,
    updated_at = excluded.updated_at;
end;
$$;

revoke all on function public.set_project_access(text, text, text) from public;
grant execute on function public.set_project_access(text, text, text) to authenticated;

create table if not exists public.workbench_notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '' check (char_length(title) <= 120),
  content text not null check (char_length(content) between 1 and 2000),
  category text not null default '个人' check (char_length(category) between 1 and 40),
  color text not null default 'mint' check (color in ('mint', 'blue', 'yellow', 'rose')),
  completed boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.quick_links (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 1 and 80),
  url text not null check (char_length(url) between 1 and 2000),
  category text not null default '个人' check (char_length(category) between 1 and 40),
  image_url text not null default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quick_links
  add column if not exists image_url text not null default '';

create table if not exists public.quick_link_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 40),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workbench_moods (
  mood_date date primary key,
  mood text not null check (mood in ('great', 'good', 'calm', 'tired', 'busy')),
  note text not null default '' check (char_length(note) <= 300),
  updated_at timestamptz not null default now()
);

create table if not exists public.workbench_schedule_items (
  id uuid primary key default gen_random_uuid(),
  item_date date not null,
  start_time time not null,
  end_time time not null,
  title text not null check (char_length(title) between 1 and 120),
  notes text not null default '' check (char_length(notes) <= 500),
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (end_time > start_time)
);

create index if not exists workbench_schedule_items_date_time_idx
on public.workbench_schedule_items (item_date, start_time);

alter table public.workbench_notes enable row level security;
alter table public.quick_links enable row level security;
alter table public.quick_link_categories enable row level security;
alter table public.workbench_moods enable row level security;
alter table public.workbench_schedule_items enable row level security;

drop policy if exists "Admins manage workbench notes" on public.workbench_notes;
create policy "Admins manage workbench notes" on public.workbench_notes for all to authenticated
using ((select private.is_portfolio_admin())) with check ((select private.is_portfolio_admin()));

drop policy if exists "Admins manage quick links" on public.quick_links;
create policy "Admins manage quick links" on public.quick_links for all to authenticated
using ((select private.is_portfolio_admin())) with check ((select private.is_portfolio_admin()));

drop policy if exists "Admins manage quick link categories" on public.quick_link_categories;
create policy "Admins manage quick link categories" on public.quick_link_categories for all to authenticated
using ((select private.is_portfolio_admin())) with check ((select private.is_portfolio_admin()));

drop policy if exists "Admins manage workbench moods" on public.workbench_moods;
create policy "Admins manage workbench moods" on public.workbench_moods for all to authenticated
using ((select private.is_portfolio_admin())) with check ((select private.is_portfolio_admin()));

drop policy if exists "Admins manage workbench schedule" on public.workbench_schedule_items;
create policy "Admins manage workbench schedule" on public.workbench_schedule_items for all to authenticated
using ((select private.is_portfolio_admin())) with check ((select private.is_portfolio_admin()));

grant select, insert, update, delete on public.workbench_notes, public.quick_links, public.quick_link_categories, public.workbench_moods, public.workbench_schedule_items to authenticated;

insert into public.quick_link_categories (name, sort_order)
values ('设计', 0), ('开发', 1), ('工具', 2), ('个人', 3)
on conflict (name) do nothing;

alter table public.ai_profile
  add column if not exists persona text not null default '',
  add column if not exists dialogue_presets jsonb not null default '[]'::jsonb,
  add column if not exists opening_messages jsonb not null default '[]'::jsonb,
  add column if not exists operation_rules text not null default '',
  add column if not exists workflow jsonb not null default '[]'::jsonb,
  add column if not exists prompt_template text not null default '';

alter table public.ai_profile drop constraint if exists ai_profile_dialogue_presets_check;
alter table public.ai_profile add constraint ai_profile_dialogue_presets_check check (jsonb_typeof(dialogue_presets) = 'array');
alter table public.ai_profile drop constraint if exists ai_profile_opening_messages_check;
alter table public.ai_profile add constraint ai_profile_opening_messages_check check (jsonb_typeof(opening_messages) = 'array');
alter table public.ai_profile drop constraint if exists ai_profile_workflow_check;
alter table public.ai_profile add constraint ai_profile_workflow_check check (jsonb_typeof(workflow) = 'array');

alter table public.contact_inquiries
  add column if not exists email text not null default '',
  add column if not exists budget text not null default '',
  add column if not exists project_types text[] not null default '{}';

alter table public.finance_entries
  add column if not exists contract_amount_cents bigint not null default 0,
  add column if not exists paid_amount_cents bigint not null default 0,
  add column if not exists payment_status text not null default 'paid',
  add column if not exists client_name text not null default '';

alter table public.finance_entries drop constraint if exists finance_entries_payment_status_check;
alter table public.finance_entries
  add constraint finance_entries_payment_status_check check (payment_status in ('pending', 'partial', 'paid'));

alter table public.finance_entries drop constraint if exists finance_entries_contract_amount_check;
alter table public.finance_entries add constraint finance_entries_contract_amount_check check (contract_amount_cents >= 0);
alter table public.finance_entries drop constraint if exists finance_entries_paid_amount_check;
alter table public.finance_entries add constraint finance_entries_paid_amount_check check (paid_amount_cents >= 0);

alter table public.site_settings
  add column if not exists section_visibility jsonb not null default '{"about":true,"portfolio":true,"articles":true,"contact":true}'::jsonb,
  add column if not exists about_details jsonb not null default '{}'::jsonb,
  add column if not exists contact_items jsonb not null default '[]'::jsonb,
  add column if not exists social_links jsonb not null default '[]'::jsonb,
  add column if not exists footer_registration text not null default '',
  add column if not exists consultation_content jsonb not null default '{}'::jsonb;

create table if not exists public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  name text not null default '' check (char_length(name) <= 80),
  contact text not null default '' check (char_length(contact) <= 160),
  project_types text[] not null default '{}',
  budget text not null default '',
  details text not null default '' check (char_length(details) <= 3000),
  estimate_min_cents bigint not null default 0 check (estimate_min_cents >= 0),
  estimate_max_cents bigint not null default 0 check (estimate_max_cents >= 0),
  status text not null default 'new' check (status in ('new', 'reviewed', 'converted', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quote_requests enable row level security;

drop policy if exists "Public submits quote requests" on public.quote_requests;
create policy "Public submits quote requests" on public.quote_requests for insert to anon, authenticated
with check (status = 'new' and estimate_min_cents = 0 and estimate_max_cents = 0);

drop policy if exists "Admins manage quote requests" on public.quote_requests;
create policy "Admins manage quote requests" on public.quote_requests for all to authenticated
using ((select private.is_portfolio_admin())) with check ((select private.is_portfolio_admin()));

grant insert on public.quote_requests to anon, authenticated;
grant select, update, delete on public.quote_requests to authenticated;

revoke all on public.workbench_notes from anon;
revoke all on public.quick_links from anon;
revoke all on public.quick_link_categories from anon;
revoke all on public.workbench_moods from anon;
revoke all on public.workbench_schedule_items from anon;
revoke all on public.site_events from anon, authenticated;
grant select, delete on public.site_events to authenticated;
revoke all on sequence public.site_events_id_seq from anon, authenticated;
revoke all on public.workbench_schedule_items from authenticated;
grant select, insert, update, delete on public.workbench_schedule_items to authenticated;
revoke all on public.finance_entries from anon;

revoke select, update, delete on public.quote_requests from anon;
grant insert on public.quote_requests to anon;

revoke select, update, delete on public.contact_inquiries from anon;
grant insert on public.contact_inquiries to anon;

update public.projects
set item_type = 'demo',
    category = case when category = 'Exercises and Demos' then '原型' else category end,
    tags = case when tags = ARRAY['Exercises and Demos']::text[] then ARRAY['智能家居','交互原型','场景自动化','安防告警','能源管理']::text[] else tags end,
    updated_at = now()
where slug = 'homi-smart-home-prototype';

update public.articles
set blocks = (
  select coalesce(
    jsonb_agg(
      case
        when block ->> 'type' = 'image'
          and block ->> 'src' ~ 'codex-figma-[0-9]+\.[a-zA-Z0-9]+([?#].*)?$'
        then jsonb_set(
          block,
          '{src}',
          to_jsonb(
            'https://lh1994530481-oss.github.io/Portfolio-web/articles/assets/' ||
            substring(block ->> 'src' from 'codex-figma-[0-9]+\.[a-zA-Z0-9]+')
          )
        )
        else block
      end
      order by position
    ),
    '[]'::jsonb
  )
  from jsonb_array_elements(blocks) with ordinality as article_block(block, position)
),
updated_at = now()
where slug = 'codex-figma-frontend-workflow';

-- Harden public lead submission and save protected projects atomically.
alter table public.contact_inquiries
  add column if not exists idempotency_key text;

alter table public.quote_requests
  add column if not exists idempotency_key text;

alter table public.contact_inquiries
  drop constraint if exists contact_inquiries_idempotency_key_key,
  add constraint contact_inquiries_idempotency_key_key unique (idempotency_key),
  drop constraint if exists contact_inquiries_email_length_check,
  add constraint contact_inquiries_email_length_check check (char_length(email) <= 160) not valid,
  drop constraint if exists contact_inquiries_budget_length_check,
  add constraint contact_inquiries_budget_length_check check (char_length(budget) <= 80) not valid,
  drop constraint if exists contact_inquiries_project_types_check,
  add constraint contact_inquiries_project_types_check check (
    cardinality(project_types) <= 8
    and char_length(array_to_string(project_types, '')) <= 640
  ) not valid;

alter table public.quote_requests
  drop constraint if exists quote_requests_idempotency_key_key,
  add constraint quote_requests_idempotency_key_key unique (idempotency_key),
  drop constraint if exists quote_requests_name_required_check,
  add constraint quote_requests_name_required_check check (char_length(name) between 1 and 80) not valid,
  drop constraint if exists quote_requests_contact_required_check,
  add constraint quote_requests_contact_required_check check (char_length(contact) between 3 and 160) not valid,
  drop constraint if exists quote_requests_details_required_check,
  add constraint quote_requests_details_required_check check (char_length(details) between 10 and 3000) not valid,
  drop constraint if exists quote_requests_budget_length_check,
  add constraint quote_requests_budget_length_check check (char_length(budget) <= 80) not valid,
  drop constraint if exists quote_requests_project_types_check,
  add constraint quote_requests_project_types_check check (
    cardinality(project_types) <= 8
    and char_length(array_to_string(project_types, '')) <= 640
  ) not valid;

drop policy if exists "Public submits inquiries" on public.contact_inquiries;
drop policy if exists "Public submits quote requests" on public.quote_requests;

revoke insert on public.contact_inquiries from anon, authenticated;
revoke insert on public.quote_requests from anon, authenticated;
grant select, insert on public.contact_inquiries, public.quote_requests to service_role;

create table if not exists public.lead_submission_attempts (
  id bigint generated always as identity primary key,
  fingerprint text not null check (char_length(fingerprint) = 64),
  action text not null check (action in ('inquiry', 'quote')),
  created_at timestamptz not null default now()
);

create index if not exists lead_submission_attempts_fingerprint_created_at_idx
on public.lead_submission_attempts (fingerprint, created_at desc);

create index if not exists lead_submission_attempts_created_at_idx
on public.lead_submission_attempts (created_at);

alter table public.lead_submission_attempts enable row level security;

revoke all on table public.lead_submission_attempts from public, anon, authenticated;
revoke all on sequence public.lead_submission_attempts_id_seq from public, anon, authenticated;
grant select, insert, delete on table public.lead_submission_attempts to service_role;
grant usage, select on sequence public.lead_submission_attempts_id_seq to service_role;

create or replace function public.reserve_lead_submission(
  p_fingerprint text,
  p_action text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  recent_count integer;
  daily_count integer;
begin
  if char_length(coalesce(p_fingerprint, '')) <> 64
    or p_action not in ('inquiry', 'quote') then
    raise exception 'invalid lead submission reservation';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_fingerprint, 0));

  delete from public.lead_submission_attempts
  where created_at < now() - interval '24 hours';

  select count(*)::integer
  into daily_count
  from public.lead_submission_attempts
  where fingerprint = p_fingerprint
    and created_at >= now() - interval '24 hours';

  select count(*)::integer
  into recent_count
  from public.lead_submission_attempts
  where fingerprint = p_fingerprint
    and created_at >= now() - interval '15 minutes';

  if daily_count >= 20 or recent_count >= 5 then
    return jsonb_build_object('allowed', false, 'retry_after', 900);
  end if;

  insert into public.lead_submission_attempts (fingerprint, action)
  values (p_fingerprint, p_action);

  return jsonb_build_object('allowed', true);
end;
$$;

revoke all privileges on function public.reserve_lead_submission(text, text) from public, anon, authenticated;
grant execute on function public.reserve_lead_submission(text, text) to service_role;

create or replace function public.save_project_with_access(
  p_slug text,
  p_title text,
  p_category text,
  p_tags text[],
  p_description_zh text,
  p_cover_url text,
  p_prototype_url text,
  p_item_type text,
  p_gallery jsonb,
  p_content_blocks jsonb,
  p_media_url text,
  p_client_name text,
  p_project_date date,
  p_password_enabled boolean,
  p_published boolean,
  p_sort_order integer,
  p_protected_target_url text,
  p_access_password text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved_project public.projects%rowtype;
  resolved_target_url text;
  has_existing_access boolean;
begin
  if not private.is_portfolio_admin() then
    raise exception 'not authorized';
  end if;

  if coalesce(btrim(p_slug), '') = ''
    or coalesce(btrim(p_title), '') = ''
    or coalesce(btrim(p_category), '') = '' then
    raise exception 'project slug, title, and category are required';
  end if;

  if p_item_type not in ('portfolio', 'demo') then
    raise exception 'invalid project type';
  end if;

  resolved_target_url := coalesce(
    nullif(btrim(p_protected_target_url), ''),
    nullif(btrim(p_prototype_url), '')
  );

  if p_password_enabled then
    if resolved_target_url is null then
      raise exception 'protected target URL is required';
    end if;

    if coalesce(p_access_password, '') <> ''
      and octet_length(p_access_password) not between 6 and 72 then
      raise exception 'access password must be between 6 and 72 bytes';
    end if;

    select exists (
      select 1
      from public.project_access
      where project_slug = p_slug
    ) into has_existing_access;

    if coalesce(p_access_password, '') = '' and not has_existing_access then
      raise exception 'access password is required for a new protected project';
    end if;
  end if;

  insert into public.projects (
    slug,
    title,
    category,
    tags,
    description_zh,
    cover_url,
    prototype_url,
    item_type,
    gallery,
    content_blocks,
    media_url,
    client_name,
    project_date,
    password_enabled,
    published,
    sort_order,
    updated_at
  )
  values (
    p_slug,
    p_title,
    p_category,
    coalesce(p_tags, '{}'::text[]),
    coalesce(p_description_zh, ''),
    coalesce(p_cover_url, ''),
    case when p_password_enabled then '' else coalesce(p_prototype_url, '') end,
    p_item_type,
    coalesce(p_gallery, '[]'::jsonb),
    coalesce(p_content_blocks, '[]'::jsonb),
    coalesce(p_media_url, ''),
    coalesce(p_client_name, ''),
    p_project_date,
    p_password_enabled,
    p_published,
    coalesce(p_sort_order, 0),
    now()
  )
  on conflict (slug) do update set
    title = excluded.title,
    category = excluded.category,
    tags = excluded.tags,
    description_zh = excluded.description_zh,
    cover_url = excluded.cover_url,
    prototype_url = excluded.prototype_url,
    item_type = excluded.item_type,
    gallery = excluded.gallery,
    content_blocks = excluded.content_blocks,
    media_url = excluded.media_url,
    client_name = excluded.client_name,
    project_date = excluded.project_date,
    password_enabled = excluded.password_enabled,
    published = excluded.published,
    sort_order = excluded.sort_order,
    updated_at = now()
  returning * into saved_project;

  if p_password_enabled then
    if coalesce(p_access_password, '') <> '' then
      insert into public.project_access (project_slug, target_url, password_hash, updated_at)
      values (
        p_slug,
        resolved_target_url,
        extensions.crypt(p_access_password, extensions.gen_salt('bf')),
        now()
      )
      on conflict (project_slug) do update set
        target_url = excluded.target_url,
        password_hash = excluded.password_hash,
        updated_at = excluded.updated_at;
    else
      update public.project_access
      set target_url = resolved_target_url,
          updated_at = now()
      where project_slug = p_slug;
    end if;
  else
    delete from public.project_access where project_slug = p_slug;
  end if;

  return to_jsonb(saved_project) || jsonb_build_object(
    'protected_target_url',
    case when p_password_enabled then resolved_target_url else '' end
  );
end;
$$;

revoke all privileges on function public.save_project_with_access(
  text, text, text, text[], text, text, text, text, jsonb, jsonb, text, text,
  date, boolean, boolean, integer, text, text
) from public, anon;

grant execute on function public.save_project_with_access(
  text, text, text, text[], text, text, text, text, jsonb, jsonb, text, text,
  date, boolean, boolean, integer, text, text
) to authenticated;

-- Keep privileged implementations outside the exposed Data API schema.
-- Public RPC names remain stable and use SECURITY INVOKER wrappers.

alter function public.verify_project_access(text, text) set schema private;
alter function public.set_project_access(text, text, text) set schema private;
alter function public.reserve_lead_submission(text, text) set schema private;
alter function public.save_project_with_access(
  text, text, text, text[], text, text, text, text, jsonb, jsonb, text, text,
  date, boolean, boolean, integer, text, text
) set schema private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

revoke all privileges on function private.verify_project_access(text, text)
from public, anon, authenticated, service_role;
grant execute on function private.verify_project_access(text, text) to anon, authenticated;

revoke all privileges on function private.set_project_access(text, text, text)
from public, anon, authenticated, service_role;
grant execute on function private.set_project_access(text, text, text) to authenticated;

revoke all privileges on function private.reserve_lead_submission(text, text)
from public, anon, authenticated, service_role;
grant execute on function private.reserve_lead_submission(text, text) to service_role;

revoke all privileges on function private.save_project_with_access(
  text, text, text, text[], text, text, text, text, jsonb, jsonb, text, text,
  date, boolean, boolean, integer, text, text
) from public, anon, authenticated, service_role;
grant execute on function private.save_project_with_access(
  text, text, text, text[], text, text, text, text, jsonb, jsonb, text, text,
  date, boolean, boolean, integer, text, text
) to authenticated;

create or replace function public.verify_project_access(
  p_project_slug text,
  p_password text
)
returns text
language sql
stable
security invoker
set search_path = ''
as $$
  select private.verify_project_access(p_project_slug, p_password);
$$;

create or replace function public.set_project_access(
  p_project_slug text,
  p_target_url text,
  p_password text
)
returns void
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.set_project_access(p_project_slug, p_target_url, p_password);
$$;

create or replace function public.reserve_lead_submission(
  p_fingerprint text,
  p_action text
)
returns jsonb
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.reserve_lead_submission(p_fingerprint, p_action);
$$;

create or replace function public.save_project_with_access(
  p_slug text,
  p_title text,
  p_category text,
  p_tags text[],
  p_description_zh text,
  p_cover_url text,
  p_prototype_url text,
  p_item_type text,
  p_gallery jsonb,
  p_content_blocks jsonb,
  p_media_url text,
  p_client_name text,
  p_project_date date,
  p_password_enabled boolean,
  p_published boolean,
  p_sort_order integer,
  p_protected_target_url text,
  p_access_password text
)
returns jsonb
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.save_project_with_access(
    p_slug,
    p_title,
    p_category,
    p_tags,
    p_description_zh,
    p_cover_url,
    p_prototype_url,
    p_item_type,
    p_gallery,
    p_content_blocks,
    p_media_url,
    p_client_name,
    p_project_date,
    p_password_enabled,
    p_published,
    p_sort_order,
    p_protected_target_url,
    p_access_password
  );
$$;

revoke all privileges on function public.verify_project_access(text, text)
from public, anon, authenticated, service_role;
grant execute on function public.verify_project_access(text, text) to anon, authenticated;

revoke all privileges on function public.set_project_access(text, text, text)
from public, anon, authenticated, service_role;
grant execute on function public.set_project_access(text, text, text) to authenticated;

revoke all privileges on function public.reserve_lead_submission(text, text)
from public, anon, authenticated, service_role;
grant execute on function public.reserve_lead_submission(text, text) to service_role;

revoke all privileges on function public.save_project_with_access(
  text, text, text, text[], text, text, text, text, jsonb, jsonb, text, text,
  date, boolean, boolean, integer, text, text
) from public, anon, authenticated, service_role;
grant execute on function public.save_project_with_access(
  text, text, text, text[], text, text, text, text, jsonb, jsonb, text, text,
  date, boolean, boolean, integer, text, text
) to authenticated;
