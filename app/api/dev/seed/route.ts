export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { randomUUID } from 'crypto'

export async function POST() {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'No disponible en producción' }, { status: 403 })
  }

  // ── Categorías (idempotente, corre siempre) ──────────────────────────────
  const hasCats = (db.prepare(`SELECT COUNT(*) as c FROM categories`).get() as { c: number }).c > 0

  if (!hasCats) {
    const insC = db.prepare(`INSERT INTO categories (id, name, parent_id, order_index) VALUES (?, ?, ?, ?)`)

    // Categorías padre
    const cColumna    = randomUUID()
    const cMiInf      = randomUUID()
    const cMiSup      = randomUUID()
    const cCore       = randomUUID()

    insC.run(cColumna, 'Columna',           null, 0)
    insC.run(cMiInf,   'Miembro inferior',  null, 1)
    insC.run(cMiSup,   'Miembro superior',  null, 2)
    insC.run(cCore,    'Core y estabilidad',null, 3)

    // Subcategorías — Columna
    const scLumbar   = randomUUID()
    const scCervical = randomUUID()
    const scDorsal   = randomUUID()
    insC.run(scLumbar,   'Lumbar',   cColumna, 0)
    insC.run(scCervical, 'Cervical', cColumna, 1)
    insC.run(scDorsal,   'Dorsal',   cColumna, 2)

    // Subcategorías — Miembro inferior
    const scRodilla     = randomUUID()
    const scCadera      = randomUUID()
    const scIsquios     = randomUUID()
    const scTobillo     = randomUUID()
    insC.run(scRodilla,  'Rodilla',         cMiInf, 0)
    insC.run(scCadera,   'Cadera y glúteos',cMiInf, 1)
    insC.run(scIsquios,  'Isquiotibiales',  cMiInf, 2)
    insC.run(scTobillo,  'Tobillo y pie',   cMiInf, 3)

    // Subcategorías — Miembro superior
    const scHombro  = randomUUID()
    const scCodo    = randomUUID()
    const scMuneca  = randomUUID()
    insC.run(scHombro, 'Hombro',       cMiSup, 0)
    insC.run(scCodo,   'Codo',         cMiSup, 1)
    insC.run(scMuneca, 'Muñeca y mano',cMiSup, 2)

    // Subcategorías — Core
    const scAbdomen = randomUUID()
    const scSuelo   = randomUUID()
    insC.run(scAbdomen, 'Abdomen',        cCore, 0)
    insC.run(scSuelo,   'Suelo pélvico',  cCore, 1)

    // Asignar categorías a los ejercicios existentes por nombre
    const assign = db.prepare(`UPDATE exercises SET category_id = ? WHERE name = ?`)
    assign.run(scCadera,  'Puente glúteo')
    assign.run(scAbdomen, 'Dead bug')
    assign.run(scHombro,  'Retracción escapular')
    assign.run(scIsquios, 'Estiramiento isquiotibiales')
    assign.run(scRodilla, 'Sentadilla goblet')
  }

  // ── Pacientes, ejercicios, rutinas (solo si no hay datos) ────────────────
  const hasPatients = (db.prepare(`SELECT COUNT(*) as c FROM patients`).get() as { c: number }).c > 0
  if (hasPatients) {
    return NextResponse.json({ ok: true, message: hasCats ? 'Ya había datos' : 'Categorías aplicadas' })
  }

  const seed = db.transaction(() => {
    const exIds = Array.from({ length: 5 }, () => randomUUID())
    const insEx = db.prepare(`INSERT INTO exercises (id, name, description, video_type, video_url, tags) VALUES (?, ?, ?, ?, ?, ?)`)
    insEx.run(exIds[0], 'Puente glúteo',             'Activación de glúteos en decúbito dorsal',    'youtube', 'https://www.youtube.com/watch?v=wPM8icPu6H8', '["glúteos","lumbar"]')
    insEx.run(exIds[1], 'Dead bug',                  'Estabilidad de core en decúbito dorsal',      'youtube', 'https://www.youtube.com/watch?v=4XLEnwUr1d8', '["core","lumbar"]')
    insEx.run(exIds[2], 'Retracción escapular',       'Movilización y fortalecimiento de escápulas', 'youtube', 'https://www.youtube.com/watch?v=8LtHapMG90Q', '["hombro","postura"]')
    insEx.run(exIds[3], 'Estiramiento isquiotibiales','Elongación con banda elástica',               'youtube', 'https://www.youtube.com/watch?v=G-fo0esKnRA', '["isquiotibiales","flexibilidad"]')
    insEx.run(exIds[4], 'Sentadilla goblet',          'Sentadilla con carga al frente',              'youtube', 'https://www.youtube.com/watch?v=MxsFDJCGFqs', '["cuádriceps","rodilla"]')

    const r1 = randomUUID(), r2 = randomUUID()
    db.prepare(`INSERT INTO routines (id, name, description, body_zone, difficulty, estimated_minutes) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(r1, 'Lumbar básica',  'Activación y estabilidad para dolor lumbar',    'Columna lumbar', 'suave',   25)
    db.prepare(`INSERT INTO routines (id, name, description, body_zone, difficulty, estimated_minutes) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(r2, 'Hombro fase 2', 'Fortalecimiento post-cirugía de manguito',       'Hombro',         'moderado', 30)

    const b1 = randomUUID(), b2 = randomUUID(), b3 = randomUUID()
    db.prepare(`INSERT INTO blocks (id, routine_id, name, order_index, notes) VALUES (?, ?, ?, ?, ?)`)
      .run(b1, r1, 'Activación', 0, 'Respiración diafragmática entre series')
    db.prepare(`INSERT INTO blocks (id, routine_id, name, order_index) VALUES (?, ?, ?, ?)`)
      .run(b2, r1, 'Estiramiento final', 1)
    db.prepare(`INSERT INTO blocks (id, routine_id, name, order_index) VALUES (?, ?, ?, ?)`)
      .run(b3, r2, 'Movilización y fuerza', 0)

    db.prepare(`INSERT INTO block_exercises (id, block_id, exercise_id, order_index, sets, reps, rest_seconds) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(randomUUID(), b1, exIds[0], 0, 3, 12, 45)
    db.prepare(`INSERT INTO block_exercises (id, block_id, exercise_id, order_index, sets, reps, rest_seconds) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(randomUUID(), b1, exIds[1], 1, 3,  8, 60)
    db.prepare(`INSERT INTO block_exercises (id, block_id, exercise_id, order_index, duration_seconds) VALUES (?, ?, ?, ?, ?)`)
      .run(randomUUID(), b2, exIds[3], 0, 30)
    db.prepare(`INSERT INTO block_exercises (id, block_id, exercise_id, order_index, sets, reps, rest_seconds) VALUES (?, ?, ?, ?, ?, ?, ?)`)
      .run(randomUUID(), b3, exIds[2], 0, 4, 15, 45)

    const p1 = randomUUID(), p2 = randomUUID(), p3 = randomUUID()
    db.prepare(`INSERT INTO patients (id, first_name, last_name, birth_date, consultation_reason, public_token) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(p1, 'María',  'González',  '1985-03-15', 'Dolor lumbar crónico',    randomUUID().replace(/-/g, ''))
    db.prepare(`INSERT INTO patients (id, first_name, last_name, birth_date, consultation_reason, public_token) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(p2, 'Carlos', 'Rodríguez', '1972-07-22', 'Post-cirugía de hombro',  randomUUID().replace(/-/g, ''))
    db.prepare(`INSERT INTO patients (id, first_name, last_name, birth_date, consultation_reason, public_token) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(p3, 'Laura',  'Fernández', '1995-11-08', 'Tendinitis rotuliana',    randomUUID().replace(/-/g, ''))

    db.prepare(`INSERT INTO assignments (id, patient_id, routine_id, start_date, frequency_per_week, total_sessions) VALUES (?, ?, ?, ?, ?, ?)`)
      .run(randomUUID(), p1, r1, new Date().toISOString().split('T')[0], 3, 18)
  })

  seed()
  return NextResponse.json({ ok: true, message: 'Seed completo aplicado' })
}
