-- Standard Workspace — portfolio control panel schema
-- Creates the workspace schema with 3 tables: sessions, health_checks, tunnels.
-- RLS enabled on all tables; owner can CRUD their own rows.

create schema if not exists workspace;

-- sessions: ms-suite dev sessions (start/stop/status/logs)
create table if not exists workspace.sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  label text not null,
  apps text not null default '',
  pid integer,
  status text not null default 'starting',
  log_cursor text,
  metadata jsonb,
  started_at timestamptz not null default now(),
  stopped_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_sessions_owner_idx on workspace.sessions(owner_id);
create index if not exists workspace_sessions_status_idx on workspace.sessions(status);

-- health_checks: probe results from workspace health/run endpoint
create table if not exists workspace.health_checks (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  target text not null,
  url text not null,
  status text not null,
  latency_ms integer,
  detail text,
  checked_at timestamptz not null default now()
);

create index if not exists workspace_health_owner_idx on workspace.health_checks(owner_id);
create index if not exists workspace_health_target_idx on workspace.health_checks(target);
create index if not exists workspace_health_checked_idx on workspace.health_checks(checked_at);

-- tunnels: webhook tunnel registry (cloudflare / localhost / ngrok)
create table if not exists workspace.tunnels (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null,
  name text not null,
  target_app text not null,
  target_path text not null default '/',
  public_url text,
  provider text not null default 'cloudflare',
  status text not null default 'inactive',
  metadata jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists workspace_tunnels_owner_idx on workspace.tunnels(owner_id);
create index if not exists workspace_tunnels_target_idx on workspace.tunnels(target_app);

-- RLS
alter table workspace.sessions enable row level security;
alter table workspace.health_checks enable row level security;
alter table workspace.tunnels enable row level security;

-- Owner policies: a user can CRUD their own rows (matched on auth.uid()::text = owner_id)
create policy "sessions owner select" on workspace.sessions for select using (auth.uid()::text = owner_id);
create policy "sessions owner insert" on workspace.sessions for insert with check (auth.uid()::text = owner_id);
create policy "sessions owner update" on workspace.sessions for update using (auth.uid()::text = owner_id) with check (auth.uid()::text = owner_id);
create policy "sessions owner delete" on workspace.sessions for delete using (auth.uid()::text = owner_id);

create policy "health owner select" on workspace.health_checks for select using (auth.uid()::text = owner_id);
create policy "health owner insert" on workspace.health_checks for insert with check (auth.uid()::text = owner_id);
create policy "health owner update" on workspace.health_checks for update using (auth.uid()::text = owner_id) with check (auth.uid()::text = owner_id);
create policy "health owner delete" on workspace.health_checks for delete using (auth.uid()::text = owner_id);

create policy "tunnels owner select" on workspace.tunnels for select using (auth.uid()::text = owner_id);
create policy "tunnels owner insert" on workspace.tunnels for insert with check (auth.uid()::text = owner_id);
create policy "tunnels owner update" on workspace.tunnels for update using (auth.uid()::text = owner_id) with check (auth.uid()::text = owner_id);
create policy "tunnels owner delete" on workspace.tunnels for delete using (auth.uid()::text = owner_id);

-- updated_at trigger
create or replace function workspace.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sessions_set_updated_at on workspace.sessions;
create trigger sessions_set_updated_at before update on workspace.sessions
  for each row execute function workspace.set_updated_at();

drop trigger if exists tunnels_set_updated_at on workspace.tunnels;
create trigger tunnels_set_updated_at before update on workspace.tunnels
  for each row execute function workspace.set_updated_at();
