-- ===========================================================================
-- Polla Ganadora · Esquema de base de datos (Supabase / PostgreSQL)
--
-- Cómo usarlo:
--   1. Entra a tu proyecto en https://supabase.com
--   2. Abre "SQL Editor" → "New query"
--   3. Pega TODO este archivo y dale "Run".
--
-- Es seguro re-ejecutarlo: usa "if not exists" / "drop policy if exists".
-- ===========================================================================

-- Predicciones: una fila por (participante, partido).
create table if not exists public.predictions (
  participant text   not null,
  match_id    text   not null,
  home        smallint not null check (home >= 0 and home <= 99),
  away        smallint not null check (away >= 0 and away <= 99),
  updated_at  timestamptz not null default now(),
  primary key (participant, match_id)
);

-- Resultados reales: una fila por partido.
create table if not exists public.results (
  match_id   text primary key,
  home       smallint not null check (home >= 0 and home <= 99),
  away       smallint not null check (away >= 0 and away <= 99),
  updated_at timestamptz not null default now()
);

-- Seguridad por filas (RLS) activada en ambas tablas.
alter table public.predictions enable row level security;
alter table public.results     enable row level security;

-- ---------------------------------------------------------------------------
-- Predicciones: como no hay cuentas, cualquiera (clave anónima) puede leer,
-- insertar y actualizar su propia predicción por nombre.
-- ---------------------------------------------------------------------------
drop policy if exists "predictions_select" on public.predictions;
drop policy if exists "predictions_insert" on public.predictions;
drop policy if exists "predictions_update" on public.predictions;

create policy "predictions_select" on public.predictions
  for select using (true);
create policy "predictions_insert" on public.predictions
  for insert with check (true);
create policy "predictions_update" on public.predictions
  for update using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Resultados: cualquiera puede LEER, pero escribir solo se permite desde el
-- servidor con la "service role key" (que ignora RLS). Así nadie puede
-- manipular los resultados reales desde el navegador.
-- ---------------------------------------------------------------------------
drop policy if exists "results_select" on public.results;

create policy "results_select" on public.results
  for select using (true);
