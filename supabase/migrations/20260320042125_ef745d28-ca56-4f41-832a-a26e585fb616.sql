create type public.app_role as enum ('admin', 'moderator', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  created_at timestamp with time zone not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_roles
    where user_id = _user_id
      and role = _role
  )
$$;

create policy "Users can read own roles"
on public.user_roles
for select
to authenticated
using (auth.uid() = user_id);

create policy "Admins can read all roles"
on public.user_roles
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

create policy "Admins can manage roles"
on public.user_roles
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

create policy "Admins can read all profiles"
on public.profiles
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

insert into public.user_roles (user_id, role)
select id, 'admin'::public.app_role
from public.profiles
order by created_at asc
limit 1
on conflict (user_id, role) do nothing;