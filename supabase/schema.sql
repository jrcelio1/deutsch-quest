-- =============================================================
--  Deutsch Quest — schema do Supabase
--  Como usar: Supabase → SQL Editor → New query → cole tudo → Run
--
--  🔐 Lição de segurança deste arquivo:
--  A chave pública do app fica exposta no navegador (e no GitHub).
--  Quem protege os dados é o RLS (Row Level Security): regras no
--  próprio banco dizendo QUEM pode ler/escrever CADA linha.
-- =============================================================

-- ---------- Tabelas ----------

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default 'Jogador' check (char_length(display_name) between 1 and 40),
  duo_code     text check (duo_code ~ '^[A-Z0-9]{8}$'),
  created_at   timestamptz not null default now()
);

-- Progresso completo (privado: só o dono lê)
create table if not exists public.user_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null,
  updated_at timestamptz not null default now(),
  -- limita o tamanho para ninguém usar o banco como "HD grátis"
  constraint state_size check (octet_length(state::text) < 300000)
);

-- Estatísticas resumidas (a dupla consegue ver)
create table if not exists public.duo_stats (
  user_id      uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  xp           integer not null default 0 check (xp >= 0),
  streak       integer not null default 0 check (streak >= 0),
  streak_last  date,
  today        date,
  today_xp     integer not null default 0 check (today_xp >= 0),
  week_start   date,
  week_xp      integer not null default 0 check (week_xp >= 0),
  goal_days    jsonb not null default '[]'::jsonb,
  updated_at   timestamptz not null default now()
);

-- ---------- Perfil criado automaticamente no cadastro ----------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    left(coalesce(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 'Jogador'), 40)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Função auxiliar: código da MINHA dupla ----------
-- security definer evita recursão infinita nas políticas RLS

create or replace function public.my_duo_code()
returns text
language sql stable
security definer set search_path = ''
as $$
  select duo_code from public.profiles where id = auth.uid();
$$;

-- ---------- RLS ----------

alter table public.profiles   enable row level security;
alter table public.user_state enable row level security;
alter table public.duo_stats  enable row level security;

-- profiles: vejo o meu e o da minha dupla; só altero o meu nome
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = auth.uid() or (duo_code is not null and duo_code = public.my_duo_code()));

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Privilégio por COLUNA: o usuário só pode mudar display_name.
-- duo_code só muda pelas funções create_duo/join_duo (que validam regras).
revoke update on public.profiles from authenticated, anon;
grant update (display_name) on public.profiles to authenticated;

-- user_state: totalmente privado
drop policy if exists "state_own" on public.user_state;
create policy "state_own" on public.user_state
  for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- duo_stats: escrevo só o meu; leio o meu e o da minha dupla
drop policy if exists "stats_write_own" on public.duo_stats;
create policy "stats_write_own" on public.duo_stats
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "stats_update_own" on public.duo_stats;
create policy "stats_update_own" on public.duo_stats
  for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "stats_select_duo" on public.duo_stats;
create policy "stats_select_duo" on public.duo_stats
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (
      select 1 from public.profiles p
      where p.id = duo_stats.user_id
        and p.duo_code is not null
        and p.duo_code = public.my_duo_code()
    )
  );

-- Visitantes não logados (anon) não acessam nada
revoke all on public.profiles, public.user_state, public.duo_stats from anon;

-- ---------- Funções da dupla ----------

-- Cria um código aleatório de 8 caracteres (≈ 41 bits) para a minha dupla
create or replace function public.create_duo()
returns text
language plpgsql
security definer set search_path = ''
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  new_code text := '';
  i int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;

  select duo_code into new_code from public.profiles where id = auth.uid();
  if new_code is not null then return new_code; end if;

  loop
    new_code := '';
    for i in 1..8 loop
      new_code := new_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.profiles where duo_code = new_code);
  end loop;

  update public.profiles set duo_code = new_code where id = auth.uid();
  return new_code;
end;
$$;

-- Entra numa dupla existente (máximo 2 pessoas por dupla)
create or replace function public.join_duo(code text)
returns void
language plpgsql
security definer set search_path = ''
as $$
declare
  members int;
begin
  if auth.uid() is null then raise exception 'not authenticated'; end if;
  if code !~ '^[A-Z0-9]{8}$' then raise exception 'código inválido'; end if;

  select count(*) into members from public.profiles where duo_code = code;
  if members = 0 then raise exception 'código não encontrado'; end if;
  if members >= 2 then raise exception 'esta dupla já está completa'; end if;

  update public.profiles set duo_code = code where id = auth.uid();
end;
$$;

create or replace function public.leave_duo()
returns void
language sql
security definer set search_path = ''
as $$
  update public.profiles set duo_code = null where id = auth.uid();
$$;

-- Só usuários logados podem chamar as funções
revoke execute on function public.create_duo(), public.join_duo(text), public.leave_duo(), public.my_duo_code() from public, anon;
grant execute on function public.create_duo(), public.join_duo(text), public.leave_duo(), public.my_duo_code() to authenticated;
