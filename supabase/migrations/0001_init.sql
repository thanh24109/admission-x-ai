create extension if not exists vector;

create table if not exists admission_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_url text,
  published_at timestamptz,
  valid_from date,
  valid_to date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists admission_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references admission_documents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists candidate_profiles (
  candidate_id uuid primary key,
  interested_programs text[] not null default '{}',
  study_preferences text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table if not exists handovers (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null,
  reason text not null,
  summary text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);
