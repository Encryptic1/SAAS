import { sql } from "drizzle-orm";
import type { getPgliteDb } from "./local";

type Db = Awaited<ReturnType<typeof getPgliteDb>>;

const DDL = `
CREATE SCHEMA IF NOT EXISTS shared;
CREATE SCHEMA IF NOT EXISTS polls;
CREATE SCHEMA IF NOT EXISTS proof;
CREATE SCHEMA IF NOT EXISTS metrics;
CREATE SCHEMA IF NOT EXISTS hook;
CREATE SCHEMA IF NOT EXISTS release;
CREATE SCHEMA IF NOT EXISTS standup;
CREATE SCHEMA IF NOT EXISTS links;

CREATE TABLE IF NOT EXISTS polls.workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  slack_team_id text NOT NULL UNIQUE,
  slack_team_name text,
  bot_token text NOT NULL,
  plan text DEFAULT 'free' NOT NULL,
  show_badge boolean DEFAULT true NOT NULL,
  installed_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS polls.workspace_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL REFERENCES polls.workspaces(id),
  user_id text NOT NULL,
  role text DEFAULT 'admin' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS polls.polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL REFERENCES polls.workspaces(id),
  channel_id text NOT NULL,
  message_ts text,
  question text NOT NULL,
  options text[] NOT NULL,
  created_by text NOT NULL,
  is_anonymous boolean DEFAULT false NOT NULL,
  is_closed boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS polls.votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  poll_id uuid NOT NULL REFERENCES polls.polls(id),
  slack_user_id text NOT NULL,
  option_index integer NOT NULL,
  voted_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS proof.collections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  owner_id text NOT NULL,
  plan text DEFAULT 'free' NOT NULL,
  show_badge boolean DEFAULT true NOT NULL,
  theme text DEFAULT 'dark' NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS proof.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  collection_id uuid NOT NULL REFERENCES proof.collections(id),
  author_name text NOT NULL,
  author_title text,
  author_avatar_url text,
  content text NOT NULL,
  rating integer,
  is_approved boolean DEFAULT false NOT NULL,
  is_featured boolean DEFAULT false NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS metrics.stripe_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  stripe_account_id text NOT NULL UNIQUE,
  owner_id text NOT NULL,
  access_token text NOT NULL,
  refresh_token text,
  plan text DEFAULT 'free' NOT NULL,
  connected_at timestamptz DEFAULT now() NOT NULL,
  last_sync_at timestamptz
);

CREATE TABLE IF NOT EXISTS metrics.metric_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  stripe_account_id uuid NOT NULL REFERENCES metrics.stripe_accounts(id),
  snapshot_date timestamptz NOT NULL,
  mrr numeric(12, 2) NOT NULL,
  arr numeric(12, 2) NOT NULL,
  churn_rate numeric(5, 4),
  ltv numeric(12, 2),
  active_subscriptions integer DEFAULT 0 NOT NULL,
  breakdown jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS metrics.payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  stripe_account_id uuid NOT NULL REFERENCES metrics.stripe_accounts(id),
  stripe_link_id text NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  active boolean DEFAULT true NOT NULL,
  click_count integer DEFAULT 0 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS metrics.quota_samples (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  stripe_account_id uuid REFERENCES metrics.stripe_accounts(id),
  source text NOT NULL,
  quota_label text NOT NULL,
  used integer DEFAULT 0 NOT NULL,
  "limit" integer,
  window_started_at timestamptz NOT NULL,
  window_ends_at timestamptz,
  metadata jsonb,
  sampled_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quota_samples_source_window ON metrics.quota_samples (source, window_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_quota_samples_sampled_at ON metrics.quota_samples (sampled_at DESC);

CREATE TABLE IF NOT EXISTS shared.kpi_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  product text NOT NULL,
  event text NOT NULL,
  user_id text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS shared.billing_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  product text NOT NULL,
  external_user_id text NOT NULL,
  stripe_customer_id text NOT NULL,
  stripe_subscription_id text,
  plan text DEFAULT 'free' NOT NULL,
  show_badge boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS shared.sso_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  user_id text NOT NULL,
  code text NOT NULL UNIQUE,
  target_app text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS shared.digest_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_id text NOT NULL,
  slack_workspace_id uuid,
  slack_channel_id text,
  frequency text DEFAULT 'weekly' NOT NULL,
  sources jsonb NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS shared.pulse_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  org_id uuid,
  user_id text,
  source text NOT NULL,
  title text NOT NULL,
  body text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS hook.webhook_inboxes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_id text NOT NULL,
  slug text NOT NULL UNIQUE,
  name text DEFAULT 'Inbox' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS hook.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  inbox_id uuid NOT NULL REFERENCES hook.webhook_inboxes(id),
  method text DEFAULT 'POST' NOT NULL,
  headers jsonb,
  body text,
  query_params jsonb,
  received_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS release.repos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_id text NOT NULL,
  github_installation_id bigint,
  repo_full_name text NOT NULL,
  default_branch text DEFAULT 'main' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS release.notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  repo_id uuid NOT NULL REFERENCES release.repos(id),
  version text NOT NULL,
  title text,
  body_md text NOT NULL,
  published_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS standup.prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  workspace_id uuid NOT NULL REFERENCES polls.workspaces(id),
  channel_id text NOT NULL,
  schedule_cron text DEFAULT '0 9 * * 1-5' NOT NULL,
  questions text[] NOT NULL,
  enabled boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS standup.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  prompt_id uuid NOT NULL REFERENCES standup.prompts(id),
  slack_user_id text NOT NULL,
  answers text[] NOT NULL,
  submitted_at timestamptz DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS links.link_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_id text NOT NULL,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  stripe_url text NOT NULL,
  stripe_link_id text,
  active boolean DEFAULT true NOT NULL,
  click_count integer DEFAULT 0 NOT NULL,
  last_clicked_at timestamptz,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_link_records_owner ON links.link_records (owner_id);

CREATE TABLE IF NOT EXISTS links.link_click_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  link_id uuid NOT NULL REFERENCES links.link_records(id),
  ip_hash text,
  user_agent text,
  referrer text,
  utm jsonb,
  clicked_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_link_click_events_link ON links.link_click_events (link_id, clicked_at DESC);

-- Incremental migrations for existing PGlite databases
ALTER TABLE proof.collections ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0 NOT NULL;
ALTER TABLE proof.testimonials ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0 NOT NULL;
ALTER TABLE shared.billing_customers ADD COLUMN IF NOT EXISTS stripe_subscription_id text;
ALTER TABLE shared.billing_customers ADD COLUMN IF NOT EXISTS show_badge boolean DEFAULT true NOT NULL;

-- Vault — encrypted secrets manager (standard-vault app on port 3006)
-- Schema is msvault to avoid colliding with Supabases built-in vault extension.
CREATE SCHEMA IF NOT EXISTS msvault;

CREATE TABLE IF NOT EXISTS msvault.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_id text NOT NULL,
  name text NOT NULL,
  environment text DEFAULT 'production' NOT NULL,
  github_repo text,
  description text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vault_projects_owner ON msvault.projects (owner_id, created_at DESC);

CREATE TABLE IF NOT EXISTS msvault.secrets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL REFERENCES msvault.projects(id) ON DELETE CASCADE,
  key text NOT NULL,
  ciphertext text NOT NULL,
  nonce text NOT NULL,
  value_hash text,
  version integer DEFAULT 1 NOT NULL,
  agent_reference boolean DEFAULT false NOT NULL,
  notes text,
  last_rotated_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE (project_id, key)
);
CREATE INDEX IF NOT EXISTS idx_vault_secrets_project ON msvault.secrets (project_id);

CREATE TABLE IF NOT EXISTS msvault.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL REFERENCES msvault.projects(id) ON DELETE CASCADE,
  secret_id uuid,
  action text NOT NULL,
  actor text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vault_audit_project ON msvault.audit_log (project_id, created_at DESC);

CREATE TABLE IF NOT EXISTS msvault.tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  project_id uuid NOT NULL REFERENCES msvault.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  token_hash text NOT NULL UNIQUE,
  last4 text NOT NULL,
  scopes jsonb DEFAULT '["read"]'::jsonb NOT NULL,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_vault_tokens_project ON msvault.tokens (project_id);
CREATE INDEX IF NOT EXISTS idx_vault_tokens_hash ON msvault.tokens (token_hash);

-- Suite Pulse agent observability (shared schema)
CREATE TABLE IF NOT EXISTS shared.agent_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_user_id text NOT NULL,
  agent_id text NOT NULL,
  agent_name text,
  tool text NOT NULL,
  action text NOT NULL,
  summary text NOT NULL,
  status text DEFAULT 'ok' NOT NULL,
  detail_json jsonb,
  repo_full_name text,
  branch text,
  commit_sha text,
  pr_url text,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_reports_owner ON shared.agent_reports (owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_reports_agent ON shared.agent_reports (agent_id, created_at DESC);

CREATE TABLE IF NOT EXISTS shared.agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_user_id text NOT NULL,
  agent_id text NOT NULL,
  agent_name text,
  tool text NOT NULL,
  session_id text NOT NULL,
  started_at timestamptz NOT NULL,
  ended_at timestamptz,
  prompt_tokens integer DEFAULT 0 NOT NULL,
  completion_tokens integer DEFAULT 0 NOT NULL,
  cache_read_tokens integer DEFAULT 0 NOT NULL,
  cache_write_tokens integer DEFAULT 0 NOT NULL,
  total_tokens integer DEFAULT 0 NOT NULL,
  model_id text,
  cwd text,
  repo_full_name text,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_owner ON shared.agent_sessions (owner_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_session ON shared.agent_sessions (session_id);

CREATE TABLE IF NOT EXISTS shared.agent_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_user_id text NOT NULL,
  agent_id text NOT NULL,
  session_id text,
  tool text NOT NULL,
  model_id text NOT NULL,
  cost_usd numeric(12, 6) NOT NULL,
  prompt_tokens integer DEFAULT 0 NOT NULL,
  completion_tokens integer DEFAULT 0 NOT NULL,
  cache_read_tokens integer DEFAULT 0 NOT NULL,
  cache_write_tokens integer DEFAULT 0 NOT NULL,
  rate_prompt_usd numeric(12, 8),
  rate_completion_usd numeric(12, 8),
  rate_cache_read_usd numeric(12, 8),
  rate_cache_write_usd numeric(12, 8),
  recorded_at timestamptz DEFAULT now() NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_agent_costs_owner ON shared.agent_costs (owner_user_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_costs_agent ON shared.agent_costs (agent_id, recorded_at DESC);

-- Standard Snippets (shared schema so FloodG8 Plan Editor can resolve [[snippet:abc]])
CREATE TABLE IF NOT EXISTS shared.snippets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_id uuid NOT NULL,
  title text NOT NULL,
  language text DEFAULT 'plaintext' NOT NULL,
  body text DEFAULT '' NOT NULL,
  tags text[] DEFAULT '{}'::text[] NOT NULL,
  team_id uuid,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_snippets_owner ON shared.snippets (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_snippets_team ON shared.snippets (team_id);
CREATE INDEX IF NOT EXISTS idx_snippets_title ON shared.snippets (title);

CREATE TABLE IF NOT EXISTS shared.snippet_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  snippet_id uuid NOT NULL REFERENCES shared.snippets(id) ON DELETE CASCADE,
  body text NOT NULL,
  version_note text,
  created_by uuid NOT NULL,
  version_number integer DEFAULT 1 NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_snippet_versions_snippet ON shared.snippet_versions (snippet_id, version_number DESC);

CREATE TABLE IF NOT EXISTS shared.snippet_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  snippet_id uuid NOT NULL REFERENCES shared.snippets(id) ON DELETE CASCADE,
  slug text NOT NULL,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_snippet_shares_slug_unique ON shared.snippet_shares (slug);
CREATE INDEX IF NOT EXISTS idx_snippet_shares_snippet ON shared.snippet_shares (snippet_id);

-- Standard Status (build/CI status dashboard)
CREATE SCHEMA IF NOT EXISTS status;
CREATE TABLE IF NOT EXISTS status.pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_id text NOT NULL,
  source text NOT NULL,
  repo_full_name text,
  name text NOT NULL,
  last_run_at timestamptz,
  last_status text,
  last_30_runs jsonb DEFAULT '[]'::jsonb,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_status_pipelines_owner ON status.pipelines (owner_id);
CREATE INDEX IF NOT EXISTS idx_status_pipelines_source ON status.pipelines (source);

CREATE TABLE IF NOT EXISTS status.deployments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  pipeline_id uuid NOT NULL REFERENCES status.pipelines(id) ON DELETE CASCADE,
  environment text NOT NULL,
  sha text,
  status text NOT NULL,
  deployed_at timestamptz DEFAULT now() NOT NULL,
  url text,
  metadata jsonb
);
CREATE INDEX IF NOT EXISTS idx_status_deployments_pipeline ON status.deployments (pipeline_id);
CREATE INDEX IF NOT EXISTS idx_status_deployments_deployed ON status.deployments (deployed_at DESC);

CREATE TABLE IF NOT EXISTS status.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_id text NOT NULL,
  title text NOT NULL,
  severity text DEFAULT 'sev3' NOT NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  resolved_at timestamptz,
  status text DEFAULT 'investigating' NOT NULL,
  source_pipeline_id uuid REFERENCES status.pipelines(id) ON DELETE SET NULL,
  summary text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_status_incidents_owner ON status.incidents (owner_id);
CREATE INDEX IF NOT EXISTS idx_status_incidents_status ON status.incidents (status);
CREATE INDEX IF NOT EXISTS idx_status_incidents_started ON status.incidents (started_at DESC);

-- Standard Regex (regex pattern builder + debugger)
CREATE SCHEMA IF NOT EXISTS regex;
CREATE TABLE IF NOT EXISTS regex.patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_id text NOT NULL,
  name text NOT NULL,
  pattern text NOT NULL,
  flags text DEFAULT 'g' NOT NULL,
  description text,
  test_cases jsonb DEFAULT '[]'::jsonb NOT NULL,
  tags text[] DEFAULT '{}'::text[] NOT NULL,
  is_public boolean DEFAULT false NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_regex_patterns_owner ON regex.patterns (owner_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_regex_patterns_public ON regex.patterns (is_public);
CREATE INDEX IF NOT EXISTS idx_regex_patterns_name ON regex.patterns (name);

CREATE TABLE IF NOT EXISTS regex.pattern_forks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  pattern_id uuid NOT NULL REFERENCES regex.patterns(id) ON DELETE CASCADE,
  owner_id text NOT NULL,
  pattern text NOT NULL,
  flags text DEFAULT 'g' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_regex_pattern_forks_pattern ON regex.pattern_forks (pattern_id);
CREATE INDEX IF NOT EXISTS idx_regex_pattern_forks_owner ON regex.pattern_forks (owner_id);

-- Standard Postmortem (blameless incident postmortem + recurrence)
CREATE SCHEMA IF NOT EXISTS postmortem;
CREATE TABLE IF NOT EXISTS postmortem.incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  owner_id text NOT NULL,
  title text NOT NULL,
  severity text DEFAULT 'sev3' NOT NULL,
  started_at timestamptz DEFAULT now() NOT NULL,
  resolved_at timestamptz,
  summary text,
  rootcause_md text,
  timeline jsonb DEFAULT '[]'::jsonb NOT NULL,
  sections jsonb DEFAULT '{"whatWentWell":"","whatDidnt":"","whereWeGotLucky":""}'::jsonb NOT NULL,
  status text DEFAULT 'draft' NOT NULL,
  source text,
  metadata jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_postmortem_incidents_owner ON postmortem.incidents (owner_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_postmortem_incidents_status ON postmortem.incidents (status);
CREATE INDEX IF NOT EXISTS idx_postmortem_incidents_started ON postmortem.incidents (started_at DESC);

CREATE TABLE IF NOT EXISTS postmortem.action_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  incident_id uuid NOT NULL REFERENCES postmortem.incidents(id) ON DELETE CASCADE,
  owner_id text NOT NULL,
  body text NOT NULL,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_postmortem_actions_incident ON postmortem.action_items (incident_id);
CREATE INDEX IF NOT EXISTS idx_postmortem_actions_owner ON postmortem.action_items (owner_id);

CREATE TABLE IF NOT EXISTS postmortem.recurrence_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  from_incident_id uuid NOT NULL REFERENCES postmortem.incidents(id) ON DELETE CASCADE,
  to_incident_id uuid NOT NULL REFERENCES postmortem.incidents(id) ON DELETE CASCADE,
  similarity_note text,
  created_at timestamptz DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_postmortem_recurrence_from ON postmortem.recurrence_links (from_incident_id);
CREATE INDEX IF NOT EXISTS idx_postmortem_recurrence_to ON postmortem.recurrence_links (to_incident_id);
`;

export async function pushLocalSchema(db: Db): Promise<void> {
  const statements = DDL.split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await db.execute(sql.raw(`${statement};`));
  }
}
