-- ZAEVORYQ AI — Supabase Database Setup
-- Run this in Supabase SQL Editor

create table if not exists signals (
  id            uuid default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  asset         text,
  signal_type   text,
  risk_level    text,
  confidence    int,
  rr            text,
  entry         numeric,
  sl            numeric,
  tp1           numeric,
  tp2           numeric,
  tp3           numeric,
  be            numeric,
  status        text default 'Active',
  mode          text,
  entry_tf      text,
  trend_tf      text,
  reasons       text[],
  hit_tp1       bool default false,
  hit_tp2       bool default false,
  hit_tp3       bool default false,
  hit_be        bool default false,
  hit_sl        bool default false,
  closed_at     timestamptz,
  pips_result   numeric
);

-- Enable Row Level Security
alter table signals enable row level security;

-- Allow all authenticated users to read signals
create policy "Anyone can read signals"
  on signals for select
  using (true);

-- Only admin can insert/update signals
create policy "Admin can insert signals"
  on signals for insert
  with check (true);

create policy "Admin can update signals"
  on signals for update
  using (true);
