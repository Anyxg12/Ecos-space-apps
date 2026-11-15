-- ECOS · esquema inicial (Supabase / Postgres)
-- Pegar completo en Supabase → SQL Editor → Run. Es idempotente (se puede ejecutar dos veces).
-- Privacidad: sin correo, nombre real, fecha de nacimiento ni ubicación. Auth = inicio de sesión ANÓNIMO.

-- 1) Perfiles: un seudónimo opcional por usuario anónimo
create table if not exists public.profiles (
  id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nickname text unique check (nickname is null or char_length(nickname) between 2 and 20),
  mode text not null default 'explorer' check (mode in ('junior', 'explorer', 'discovery')),
  interests text[] not null default '{}' check (cardinality(interests) <= 5),
  created_at timestamptz not null default now()
);

-- 2) Progreso: mismos ids de logros que la app (no se duplican puntos: PK compuesta)
create table if not exists public.progress (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  achievement_id text not null check (char_length(achievement_id) between 1 and 60),
  completed_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

-- 3) Caché de analogías generadas con IA (sólo la Edge Function la usa, con la service role)
create table if not exists public.analogy_cache (
  key text primary key,
  fact_id text not null,
  mode text not null,
  interests text[] not null,
  analogy text not null,
  model text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.progress enable row level security;
alter table public.analogy_cache enable row level security; -- sin políticas: nadie con la anon key puede leer/escribir

-- RLS: cada usuario sólo ve y modifica SUS filas
drop policy if exists "profiles own select" on public.profiles;
drop policy if exists "profiles own insert" on public.profiles;
drop policy if exists "profiles own update" on public.profiles;
drop policy if exists "profiles own delete" on public.profiles;
create policy "profiles own select" on public.profiles for select to authenticated using (id = auth.uid());
create policy "profiles own insert" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles own update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles own delete" on public.profiles for delete to authenticated using (id = auth.uid());

drop policy if exists "progress own select" on public.progress;
drop policy if exists "progress own insert" on public.progress;
drop policy if exists "progress own delete" on public.progress;
create policy "progress own select" on public.progress for select to authenticated using (user_id = auth.uid());
create policy "progress own insert" on public.progress for insert to authenticated with check (user_id = auth.uid());
create policy "progress own delete" on public.progress for delete to authenticated using (user_id = auth.uid());

-- 4) Ranking público: sólo seudónimo + estrellas (nunca ids). SECURITY DEFINER para agregar sin abrir las tablas.
create or replace function public.leaderboard()
returns table (nickname text, stars integer, missions integer)
language sql
stable
security definer
set search_path = public
as $$
  select p.nickname,
         count(*) filter (where g.achievement_id = any (array[
           'horizonte','spirit-historia','spirit-actividad','spirit-legado',
           'opportunity-historia','opportunity-actividad','opportunity-legado',
           'alsep-historia','alsep-actividad','alsep-legado']))::int as stars,
         count(*) filter (where g.achievement_id in ('spirit-legado','opportunity-legado','alsep-legado'))::int as missions
  from public.profiles p
  join public.progress g on g.user_id = p.id
  where p.nickname is not null
  group by p.id, p.nickname
  order by stars desc, min(g.completed_at) asc
  limit 50;
$$;

revoke all on function public.leaderboard() from public;
grant execute on function public.leaderboard() to anon, authenticated;
