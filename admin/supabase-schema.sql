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
  ('10000000-0000-4000-8000-000000000003', '文章', './articles/index.html', 2, true, false),
  ('10000000-0000-4000-8000-000000000004', '联系', '#contact', 3, true, false)
on conflict (id) do nothing;


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
  created_at timestamptz not null default now()
);

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
create policy "Public records safe site events"
on public.site_events
for insert
to anon, authenticated
with check (
  event_name in ('page_view', 'content_click', 'contact_submit', 'ai_open')
  and char_length(path) between 1 and 500
  and char_length(session_id) between 8 and 80
  and device_type in ('desktop', 'tablet', 'mobile')
);

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

grant insert on public.site_events to anon, authenticated;
grant select, delete on public.site_events to authenticated;
grant usage, select on sequence public.site_events_id_seq to anon, authenticated;

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

alter table public.workbench_notes enable row level security;
alter table public.quick_links enable row level security;
alter table public.workbench_moods enable row level security;

drop policy if exists "Admins manage workbench notes" on public.workbench_notes;
create policy "Admins manage workbench notes" on public.workbench_notes for all to authenticated
using ((select private.is_portfolio_admin())) with check ((select private.is_portfolio_admin()));

drop policy if exists "Admins manage quick links" on public.quick_links;
create policy "Admins manage quick links" on public.quick_links for all to authenticated
using ((select private.is_portfolio_admin())) with check ((select private.is_portfolio_admin()));

drop policy if exists "Admins manage workbench moods" on public.workbench_moods;
create policy "Admins manage workbench moods" on public.workbench_moods for all to authenticated
using ((select private.is_portfolio_admin())) with check ((select private.is_portfolio_admin()));

grant select, insert, update, delete on public.workbench_notes, public.quick_links, public.workbench_moods to authenticated;

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
  add column if not exists footer_registration text not null default '';

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
revoke all on public.workbench_moods from anon;
revoke all on public.finance_entries from anon;

revoke select, update, delete on public.quote_requests from anon;
grant insert on public.quote_requests to anon;

revoke select, update, delete on public.contact_inquiries from anon;
grant insert on public.contact_inquiries to anon;

update public.projects
set item_type = 'demo',
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
