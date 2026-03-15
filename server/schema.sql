-- ============================================================
-- SIMBPR — Esquema SQL Server
-- ============================================================
-- Ejecutar una sola vez en la base de datos destino.
-- Requiere SQL Server 2016+ (o Azure SQL Database).
-- ============================================================

-- ── Proyectos ────────────────────────────────────────────────
IF NOT EXISTS (
  SELECT 1 FROM sys.tables WHERE name = 'Proyectos'
)
CREATE TABLE dbo.Proyectos (
  id           INT            IDENTITY(1,1) PRIMARY KEY,
  nombre       NVARCHAR(255)  NOT NULL,
  usuario      NVARCHAR(255)  NOT NULL,
  compania     NVARCHAR(255)  NOT NULL DEFAULT '',
  cliente      NVARCHAR(255)  NOT NULL,
  orden        NVARCHAR(100)  NOT NULL DEFAULT '',
  comentarios  NVARCHAR(MAX)  NOT NULL DEFAULT '',
  fecha        NVARCHAR(50)   NOT NULL,
  estado       NVARCHAR(50)   NOT NULL DEFAULT 'Activo',
  created_at   DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
  updated_at   DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);

-- ── SimulacionIPR ────────────────────────────────────────────
IF NOT EXISTS (
  SELECT 1 FROM sys.tables WHERE name = 'SimulacionIPR'
)
CREATE TABLE dbo.SimulacionIPR (
  id           INT   IDENTITY(1,1) PRIMARY KEY,
  proyecto_id  INT   NOT NULL REFERENCES dbo.Proyectos(id) ON DELETE CASCADE,
  pws          FLOAT NOT NULL DEFAULT 0,
  pwf          FLOAT NOT NULL DEFAULT 0,
  qb           FLOAT NOT NULL DEFAULT 0,
  j_index      FLOAT NOT NULL DEFAULT 1,
  unidad       NVARCHAR(20) NOT NULL DEFAULT 'kg',
  ipr_color    NVARCHAR(20) NOT NULL DEFAULT '#2563eb',
  updated_at   DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- ── SimulacionProduccion ─────────────────────────────────────
IF NOT EXISTS (
  SELECT 1 FROM sys.tables WHERE name = 'SimulacionProduccion'
)
CREATE TABLE dbo.SimulacionProduccion (
  id           INT   IDENTITY(1,1) PRIMARY KEY,
  proyecto_id  INT   NOT NULL REFERENCES dbo.Proyectos(id) ON DELETE CASCADE,
  qt           FLOAT NOT NULL DEFAULT 0,
  bsw          FLOAT NOT NULL DEFAULT 0,
  api          FLOAT NOT NULL DEFAULT 35,
  gor          FLOAT NOT NULL DEFAULT 0,
  bo           FLOAT NOT NULL DEFAULT 1,
  updated_at   DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- ── SimulacionBSN ────────────────────────────────────────────
IF NOT EXISTS (
  SELECT 1 FROM sys.tables WHERE name = 'SimulacionBSN'
)
CREATE TABLE dbo.SimulacionBSN (
  id           INT   IDENTITY(1,1) PRIMARY KEY,
  proyecto_id  INT   NOT NULL REFERENCES dbo.Proyectos(id) ON DELETE CASCADE,
  etapas       INT   NOT NULL DEFAULT 120,
  freq         FLOAT NOT NULL DEFAULT 60,
  hp           FLOAT NOT NULL DEFAULT 200,
  volt         FLOAT NOT NULL DEFAULT 1150,
  amp          FLOAT NOT NULL DEFAULT 92,
  depth        FLOAT NOT NULL DEFAULT 2200,
  tempfondo    FLOAT NOT NULL DEFAULT 90,
  updated_at   DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
