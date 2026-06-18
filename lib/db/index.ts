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

// Agrega una columna ignorando el error si ya existe (seguro ante concurrencia)
function addCol(conn: Database.Database, table: string, colDef: string) {
  try {
    conn.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef}`)
  } catch (e: unknown) {
    if (e instanceof Error && e.message.includes('duplicate column name')) return
    throw e
  }
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

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      parent_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS patient_sessions (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      session_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS routine_days (
      id TEXT PRIMARY KEY,
      routine_id TEXT NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      order_index INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_patients_token ON patients(public_token);
    CREATE INDEX IF NOT EXISTS idx_blocks_routine ON blocks(routine_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_be_block ON block_exercises(block_id, order_index);
    CREATE INDEX IF NOT EXISTS idx_assignments_patient ON assignments(patient_id, status);
    CREATE INDEX IF NOT EXISTS idx_patient_sessions ON patient_sessions(patient_id, session_date);
    CREATE INDEX IF NOT EXISTS idx_routine_days ON routine_days(routine_id, order_index);

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `)

  // Migraciones incrementales — seguras ante concurrencia de workers
  addCol(conn, 'blocks', 'day_id TEXT REFERENCES routine_days(id) ON DELETE CASCADE')

  addCol(conn, 'patients', 'total_sessions INTEGER')
  addCol(conn, 'patients', `rehab_phase_current TEXT`)
  addCol(conn, 'patients', `rehab_phase_next TEXT`)
  addCol(conn, 'patients', `objectives TEXT NOT NULL DEFAULT '[]'`)
  addCol(conn, 'patients', `key_notes TEXT NOT NULL DEFAULT '[]'`)
  addCol(conn, 'patients', `tracking_home TEXT`)
  addCol(conn, 'patients', `tracking_training TEXT`)
  addCol(conn, 'patients', `resources TEXT NOT NULL DEFAULT '[]'`)
  addCol(conn, 'patients', `is_active INTEGER NOT NULL DEFAULT 1`)

  addCol(conn, 'assignments', `rehab_phase_current TEXT`)
  addCol(conn, 'assignments', `rehab_phase_next TEXT`)
  addCol(conn, 'assignments', `objectives TEXT NOT NULL DEFAULT '[]'`)
  addCol(conn, 'assignments', `key_notes TEXT NOT NULL DEFAULT '[]'`)
  addCol(conn, 'assignments', `tracking_home TEXT`)
  addCol(conn, 'assignments', `tracking_training TEXT`)
  addCol(conn, 'assignments', `resources TEXT NOT NULL DEFAULT '[]'`)
  addCol(conn, 'assignments', `end_date TEXT`)

  addCol(conn, 'block_exercises', `intensity_type TEXT CHECK(intensity_type IN ('rpe','rir','1rm'))`)
  addCol(conn, 'block_exercises', `intensity_value REAL`)
  addCol(conn, 'block_exercises', `per_side INTEGER NOT NULL DEFAULT 0`)
  addCol(conn, 'block_exercises', `reps_max INTEGER`)

  addCol(conn, 'routines', `public_token TEXT`)
  addCol(conn, 'routines', `tags TEXT NOT NULL DEFAULT '[]'`)
  addCol(conn, 'exercises', `category_id TEXT REFERENCES categories(id) ON DELETE SET NULL`)
  addCol(conn, 'categories', `color TEXT`)

  // Generar public_token para rutinas que no lo tengan
  const { randomUUID } = require('crypto') as typeof import('crypto')
  const routinesWithoutToken = conn.prepare(`SELECT id FROM routines WHERE public_token IS NULL`).all() as { id: string }[]
  const updToken = conn.prepare(`UPDATE routines SET public_token = ? WHERE id = ?`)
  for (const row of routinesWithoutToken) updToken.run(randomUUID().replace(/-/g, ''), row.id)
}

// Conexión perezosa (lazy): NO se crea al importar el módulo, sino en la primera
// consulta real. Esto es clave para el build: durante `next build` el disco
// persistente (ej. /var/data en Render) todavía no está montado, así que tocar
// el filesystem al importar rompía el build. Ahora solo se conecta en runtime.
const g = global as unknown as { _db?: Database.Database }

function getDb(): Database.Database {
  if (!g._db) g._db = createDb()
  return g._db
}

export const db = new Proxy({} as Database.Database, {
  get(_target, prop) {
    const conn = getDb()
    const value = Reflect.get(conn, prop, conn)
    return typeof value === 'function' ? value.bind(conn) : value
  },
  set(_target, prop, value) {
    return Reflect.set(getDb(), prop, value)
  },
})
