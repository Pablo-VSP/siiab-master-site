-- =====================================================================
-- Esquema pensado para BigQuery (dataset: `portal`)
-- =====================================================================
-- Este archivo documenta la estructura de tablas para cuando exista la
-- conexion a BigQuery. La app hoy usa una implementacion en memoria
-- (lib/data/memory-store.ts) que respeta la misma forma de datos.
--
-- IMPORTANTE sobre BigQuery:
--   BigQuery es un almacen analitico (OLAP), no transaccional. Las
--   escrituras individuales (INSERT/UPDATE) tienen latencia y cuotas.
--   Para un portal con escrituras frecuentes (crear/aprobar solicitudes)
--   se recomienda una de estas estrategias:
--     1) Usar una tabla de staging + MERGE por lotes.
--     2) Usar Postgres/Cloud SQL para el estado transaccional y replicar
--        a BigQuery para analitica.
--   El seed en memoria y la interfaz DataStore permiten cambiar la
--   implementacion sin tocar el resto de la aplicacion.
-- =====================================================================

CREATE SCHEMA IF NOT EXISTS `portal`;

-- Usuarios del portal
CREATE TABLE IF NOT EXISTS `portal.users` (
  user_id       STRING NOT NULL,
  name          STRING NOT NULL,
  email         STRING NOT NULL,
  password_hash STRING NOT NULL,          -- usar hashing real (bcrypt/argon2) fuera de BQ
  role          STRING NOT NULL,          -- 'admin' | 'approver' | 'employee'
  hire_date     DATE   NOT NULL,
  created_at    TIMESTAMP NOT NULL
);

-- Catalogo de proyectos (un proyecto agrupa varios recursos)
CREATE TABLE IF NOT EXISTS `portal.projects` (
  project_id  STRING NOT NULL,
  name        STRING NOT NULL,
  description STRING,
  created_at  TIMESTAMP NOT NULL
);

-- Recursos: sitios web y reportes de Looker Studio
--   type = 'report' -> se muestra embebido en un <iframe>
--   type = 'site'   -> se abre en una pestaña nueva
CREATE TABLE IF NOT EXISTS `portal.resources` (
  resource_id STRING NOT NULL,
  project_id  STRING NOT NULL,            -- FK logica -> projects.project_id
  title       STRING NOT NULL,
  type        STRING NOT NULL,            -- 'site' | 'report'
  url         STRING NOT NULL,
  description STRING,
  created_at  TIMESTAMP NOT NULL
);

-- Permisos por proyecto (acceso granular por usuario)
--   access = 'view' | 'manage'
CREATE TABLE IF NOT EXISTS `portal.project_permissions` (
  user_id    STRING NOT NULL,             -- FK logica -> users.user_id
  project_id STRING NOT NULL,             -- FK logica -> projects.project_id
  access     STRING NOT NULL              -- 'view' | 'manage'
);

-- Solicitudes de vacaciones
CREATE TABLE IF NOT EXISTS `portal.vacation_requests` (
  request_id       STRING NOT NULL,
  user_id          STRING NOT NULL,       -- FK logica -> users.user_id
  employee_name    STRING NOT NULL,
  hire_date        DATE   NOT NULL,
  start_date       DATE   NOT NULL,
  end_date         DATE   NOT NULL,
  delegate_name    STRING NOT NULL,
  delegate_project STRING NOT NULL,
  delegate_activity STRING NOT NULL,
  status           STRING NOT NULL,       -- 'pending' | 'approved' | 'rejected'
  rejection_reason STRING,                -- obligatorio si status = 'rejected'
  approver_id      STRING,
  approver_name    STRING,
  created_at       TIMESTAMP NOT NULL,
  resolved_at      TIMESTAMP
);
