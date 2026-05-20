import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = process.env.DATA_DIR ?? path.join(process.cwd(), 'data')

function createDb() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

  const conn = new Database(path.join(DATA_DIR, 'kinetrack.db'), { timeout: 10000 })
  conn.pragma('journal_mode = WAL')
  conn.pragma('foreign_keys = ON')
  initSchema(conn)
  return conn
}

function initSchema(conn: Database.Database) {
  conn.exec(`
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      birth_date TEXT,
      consultation_reason TEXT,
      notes TEXT,
      public_token TEXT UNIQUE NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      video_type TEXT CHECK(video_type IN ('youtube','upload')),
      video_url TEXT,
      thumbnail_url TEXT,
      duration_seconds INTEGER,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      body_zone TEXT,
      difficulty TEXT CHECK(difficulty IN ('suave','moderado','intenso')),
      estimated_minutes INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS blocks (
      id TEXT PRIMARY KEY,
      routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS block_exercises (
      id TEXT PRIMARY KEY,
      block_id TEXT NOT NULL REFERENCES blocks(id) ON DELETE CASCADE,
      exercise_id TEXT NOT NULL REFERENCES exercises(id) ON DELETE RESTRICT,
      order_index INTEGER NOT NULL,
      sets INTEGER,
      reps INTEGER,
      duration_seconds INTEGER,
      rest_seconds INTEGER,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE RESTRICT,
      start_date TEXT NOT NULL DEFAULT (date('now')),
      frequency_per_week INTEGER,
      total_sessions INTEGER,
      status TEXT CHECK(status IN ('active','completed','paused')) DEFAULT 'active',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS session_logs (
      id TEXT PRIMARY KEY,
      assignment_id TEXT NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      pain_level INTEGER CHECK(pain_level BETWEEN 0 AND 10),
      patient_notes TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_patients_token ON patients(public_token);
    CREATE INDEX IF NOT EXISTS idx_blocks_routine ON blocks(routine_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_be_block ON block_exercises(block_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_assignments_patient ON assignments(patient_id, status);

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
      order_index INTEGER NOT NULL DEFAULT 0
    );
  `)

  // Tabla de sesiones del paciente (independiente de rutinas)
  conn.exec(`
    CREATE TABLE IF NOT EXISTS patient_sessions (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      session_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_patient_sessions ON patient_sessions(patient_id, session_date);

    CREATE TABLE IF NOT EXISTS routine_days (
      id TEXT PRIMARY KEY,
      routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_routine_days ON routine_days(routine_id, order_index);
  `)

  // day_id en blocks (nullable para compatibilidad)
  const blockCols = conn.prepare(`PRAGMA table_info(blocks)`).all() as { name: string }[]
  if (!blockCols.some(c => c.name === 'day_id')) {
    conn.exec(`ALTER TABLE blocks ADD COLUMN day_id TEXT REFERENCES routine_days(id) ON DELETE CASCADE`)
  }

  // total_sessions en patients
  const pCols2 = conn.prepare(`PRAGMA table_info(patients)`).all() as { name: string }[]
  if (!pCols2.some(c => c.name === 'total_sessions')) {
    conn.exec(`ALTER TABLE patients ADD COLUMN total_sessions INTEGER`)
  }

  // Campos de plan en patients
  const patientCols = conn.prepare(`PRAGMA table_info(patients)`).all() as { name: string }[]
  const patientExtras = [
    `rehab_phase_current TEXT`,
    `rehab_phase_next TEXT`,
    `objectives TEXT NOT NULL DEFAULT '[]'`,
    `key_notes TEXT NOT NULL DEFAULT '[]'`,
    `tracking_home TEXT`,
    `tracking_training TEXT`,
    `resources TEXT NOT NULL DEFAULT '[]'`,
  ]
  for (const col of patientExtras) {
    const colName = col.split(' ')[0]
    if (!patientCols.some(c => c.name === colName)) {
      conn.exec(`ALTER TABLE patients ADD COLUMN ${col}`)
    }
  }

  // Campos extra en assignments
  const assignCols = conn.prepare(`PRAGMA table_info(assignments)`).all() as { name: string }[]
  const assignExtras = [
    `rehab_phase_current TEXT`,
    `rehab_phase_next TEXT`,
    `objectives TEXT NOT NULL DEFAULT '[]'`,
    `key_notes TEXT NOT NULL DEFAULT '[]'`,
    `tracking_home TEXT`,
    `tracking_training TEXT`,
    `resources TEXT NOT NULL DEFAULT '[]'`,
  ]
  for (const col of assignExtras) {
    const colName = col.split(' ')[0]
    if (!assignCols.some(c => c.name === colName)) {
      conn.exec(`ALTER TABLE assignments ADD COLUMN ${col}`)
    }
  }

  // is_active en patients
  const pColsActive = conn.prepare(`PRAGMA table_info(patients)`).all() as { name: string }[]
  if (!pColsActive.some(c => c.name === 'is_active')) {
    conn.exec(`ALTER TABLE patients ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1`)
  }

  // intensity en block_exercises
  const beCols = conn.prepare(`PRAGMA table_info(block_exercises)`).all() as { name: string }[]
  if (!beCols.some(c => c.name === 'intensity_type')) {
    conn.exec(`ALTER TABLE block_exercises ADD COLUMN intensity_type TEXT CHECK(intensity_type IN ('rpe','rir','1rm'))`)
  }
  if (!beCols.some(c => c.name === 'intensity_value')) {
    conn.exec(`ALTER TABLE block_exercises ADD COLUMN intensity_value REAL`)
  }

  // end_date en assignments
  const assignCols2 = conn.prepare(`PRAGMA table_info(assignments)`).all() as { name: string }[]
  if (!assignCols2.some(c => c.name === 'end_date')) {
    conn.exec(`ALTER TABLE assignments ADD COLUMN end_date TEXT`)
  }

  // Migraciones incrementales
  const routineCols = conn.prepare(`PRAGMA table_info(routines)`).all() as { name: string }[]
  if (!routineCols.some(c => c.name === 'public_token')) {
    conn.exec(`ALTER TABLE routines ADD COLUMN public_token TEXT`)
    // Generar token para rutinas existentes
    const rows = conn.prepare(`SELECT id FROM routines WHERE public_token IS NULL`).all() as { id: string }[]
    const upd = conn.prepare(`UPDATE routines SET public_token = ? WHERE id = ?`)
    const { randomUUID } = require('crypto') as typeof import('crypto')
    for (const row of rows) upd.run(randomUUID().replace(/-/g, ''), row.id)
  }

  // Agregar category_id a exercises si no existe (migración incremental)
  const cols = conn.prepare(`PRAGMA table_info(exercises)`).all() as { name: string }[]
  if (!cols.some(c => c.name === 'category_id')) {
    conn.exec(`ALTER TABLE exercises ADD COLUMN category_id TEXT REFERENCES categories(id) ON DELETE SET NULL`)
  }
}

// Singleton — un proceso, una conexión
const g = global as unknown as { _db?: Database.Database }
if (!g._db) g._db = createDb()
// initSchema es idempotente (IF NOT EXISTS), corre en cada hot-reload para aplicar migraciones
else initSchema(g._db)
export const db = g._db
