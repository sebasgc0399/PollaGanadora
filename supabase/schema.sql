-- ===========================================================================
-- Polla Ganadora · Esquema de base de datos (Supabase / PostgreSQL)  v2 SEGURO
--
-- Cómo usarlo:
--   1. Entra a tu proyecto en https://supabase.com
--   2. Abre "SQL Editor" → "New query"
--   3. Pega TODO este archivo y dale "Run".
--
-- Es seguro re-ejecutarlo. SI YA HABÍAS CORRIDO LA VERSIÓN ANTERIOR, este script
-- cierra los permisos abiertos (el navegador ya NO puede leer/escribir directo).
--
-- Modelo de seguridad:
--   • RLS activado en TODAS las tablas SIN políticas para el rol anónimo →
--     la clave pública (anon) queda sin acceso a los datos.
--   • Todo el acceso ocurre en el servidor (route handlers de Next.js) con la
--     clave service_role, que ignora RLS. Esa clave nunca llega al navegador.
-- ===========================================================================

-- Participantes: nombre + clave personal (guardada como hash, nunca en texto plano).
create table if not exists public.participants (
  name       text primary key,
  clave_hash text not null,
  created_at timestamptz not null default now()
);

-- Solicitud de "olvidé mi clave": el jugador la pide y el admin la aprueba.
alter table public.participants
  add column if not exists reset_requested_at timestamptz;

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

-- Fase eliminatoria: equipos asignados a cada llave (los pone el admin a medida
-- que se definen los cruces). home/away son códigos de equipo (texto) o NULL.
create table if not exists public.brackets (
  match_id   text primary key,
  home       text,
  away       text,
  updated_at timestamptz not null default now()
);

-- RLS activado en todas.
alter table public.participants enable row level security;
alter table public.predictions  enable row level security;
alter table public.results      enable row level security;
alter table public.brackets     enable row level security;

-- ---------------------------------------------------------------------------
-- Cerrar TODO acceso del rol anónimo: borramos cualquier política previa.
-- Con RLS activado y sin políticas, el rol "anon" no puede ni leer ni escribir.
-- El servidor usa service_role, que ignora RLS por completo.
-- ---------------------------------------------------------------------------
drop policy if exists "predictions_select" on public.predictions;
drop policy if exists "predictions_insert" on public.predictions;
drop policy if exists "predictions_update" on public.predictions;
drop policy if exists "results_select"     on public.results;

-- (No creamos ninguna política nueva: acceso solo vía service_role en el servidor.)

-- Revocar privilegios directos de los roles públicos por si acaso.
revoke all on public.participants from anon, authenticated;
revoke all on public.predictions  from anon, authenticated;
revoke all on public.results      from anon, authenticated;
revoke all on public.brackets     from anon, authenticated;
