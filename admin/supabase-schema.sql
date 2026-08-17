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

alter table public.portfolio_admins enable row level security;
alter table public.projects enable row level security;
alter table public.articles enable row level security;
alter table public.site_settings enable row level security;

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

grant usage on schema public to anon, authenticated;
grant select on public.projects, public.articles, public.site_settings to anon, authenticated;
grant insert, update, delete on public.projects, public.articles, public.site_settings to authenticated;
revoke all on public.portfolio_admins from anon, authenticated;

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
