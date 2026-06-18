import { notFound } from 'next/navigation'
import { db } from '@/lib/db'
import type { Patient, Assignment, Routine, PatientSession } from '@/lib/db/types'
import { ExternalLink, ChevronRight, Clock, Zap, Target, Brain, BarChart2, BookOpen } from 'lucide-react'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

function getPatientPlan(token: string) {
  const patient = db.prepare(`SELECT * FROM patients WHERE public_token = ?`).get(token) as Patient | null
  if (!patient) return null

  const sessions = db.prepare(
    `SELECT * FROM patient_sessions WHERE patient_id = ? ORDER BY session_date ASC`
  ).all(patient.id) as PatientSession[]

  const aRows = db.prepare(`
    SELECT a.*, r.id as r_id, r.name as r_name, r.description as r_desc,
           r.estimated_minutes as r_min, r.difficulty as r_diff, r.public_token as r_token
    FROM assignments a JOIN routines r ON r.id = a.routine_id
    WHERE a.patient_id = ? AND a.status = 'active' ORDER BY a.created_at DESC
  `).all(patient.id) as Record<string, unknown>[]

  const assignments = aRows.map(row => ({
    id: row.id as string,
    routine: {
      id: row.r_id as string,
      name: row.r_name as string,
      description: row.r_desc as string | null,
      estimated_minutes: row.r_min as number | null,
      difficulty: row.r_diff as Routine['difficulty'],
      public_token: row.r_token as string | null,
    },
  }))

  return { patient, sessions, assignments }
}

function SectionHeader({ icon: Icon, title, color = 'text-[var(--muted-foreground)]' }: {
  icon: React.ElementType; title: string; color?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className={`size-4 ${color}`} />
      <h2 className="text-sm font-medium text-[var(--foreground)]">{title}</h2>
    </div>
  )
}

export default async function PatientPublicPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const plan = getPatientPlan(token)
  if (!plan) notFound()

  const { patient, sessions, assignments } = plan
  const objectives: string[] = JSON.parse(patient.objectives || '[]')
  const keyNotes: string[] = JSON.parse(patient.key_notes || '[]')
  const resources: { label: string; url: string }[] = JSON.parse(patient.resources || '[]')

  const done = sessions.length
  const total = patient.total_sessions
  const remaining = total != null ? total - done : null
  const pct = total && total > 0 ? Math.min(100, Math.round((done / total) * 100)) : null

  const initials = `${patient.first_name[0]}${patient.last_name[0]}`.toUpperCase()

  return (
    <div className="min-h-screen bg-[var(--background)]">

      {/* Header */}
      <header className="bg-[var(--accent-teal)] text-white px-5 pt-10 pb-8">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-medium flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-white/70 text-sm mb-0.5">Tu plan de kinesiología</p>
              <h1 className="text-2xl font-medium">{patient.first_name} {patient.last_name}</h1>
              {patient.consultation_reason && (
                <p className="text-white/80 text-sm mt-0.5">{patient.consultation_reason}</p>
              )}
            </div>
          </div>

          {pct != null && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm text-white/80 mb-2">
                <span>{done} de {total} sesiones</span>
                <span className="font-medium text-white">{pct}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-xl mx-auto px-5 py-8 space-y-8">

        {/* Fase */}
        {(patient.rehab_phase_current || patient.rehab_phase_next) && (
          <section>
            <SectionHeader icon={Zap} title="Fase de rehabilitación" color="text-[var(--accent-teal)]" />
            <div className="grid grid-cols-2 gap-3">
              {patient.rehab_phase_current && (
                <div className="rounded-2xl bg-[var(--accent-teal-light)] px-4 py-4">
                  <p className="text-xs text-[var(--accent-teal)] font-medium mb-1">Actual</p>
                  <p className="text-base font-medium text-[var(--accent-teal)]">{patient.rehab_phase_current}</p>
                </div>
              )}
              {patient.rehab_phase_next && (
                <div className="rounded-2xl bg-[var(--muted)] px-4 py-4">
                  <p className="text-xs text-[var(--muted-foreground)] font-medium mb-1">Próxima</p>
                  <p className="text-base font-medium text-[var(--foreground)]">{patient.rehab_phase_next}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Objetivos */}
        {objectives.length > 0 && (
          <section>
            <SectionHeader icon={Target} title="Objetivos" color="text-emerald-500" />
            <div className="space-y-2.5">
              {objectives.map((obj, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-[var(--card)] border border-[var(--border)] px-4 py-3">
                  <div className="size-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <p className="text-base text-[var(--foreground)]">{obj}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rutinas */}
        {assignments.length > 0 && (
          <section>
            <SectionHeader icon={BookOpen} title={assignments.length === 1 ? 'Tu rutina' : 'Tus rutinas'} color="text-violet-500" />
            <div className="space-y-3">
              {assignments.map(a => (
                a.routine.public_token ? (
                  <Link
                    key={a.id}
                    href={`/r/${a.routine.public_token}`}
                    className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4 hover:border-violet-300 hover:shadow-sm transition-all group"
                  >
                    <div className="size-11 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
                      <BookOpen className="size-5 text-violet-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-medium text-[var(--foreground)]">{a.routine.name}</p>
                      <div className="flex items-center gap-3 mt-0.5 text-sm text-[var(--muted-foreground)]">
                        {a.routine.estimated_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="size-3.5" />{a.routine.estimated_minutes} min
                          </span>
                        )}
                      </div>
                      {a.routine.description && (
                        <p className="text-sm text-[var(--muted-foreground)] mt-1 line-clamp-1">{a.routine.description}</p>
                      )}
                    </div>
                    <ChevronRight className="size-5 text-[var(--muted-foreground)] group-hover:text-violet-500 flex-shrink-0 transition-colors" />
                  </Link>
                ) : (
                  <div key={a.id} className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-5 py-4">
                    <p className="text-lg font-medium text-[var(--foreground)]">{a.routine.name}</p>
                  </div>
                )
              ))}
            </div>
          </section>
        )}

        {/* Indicaciones — fondo ámbar con texto oscuro forzado para garantizar contraste */}
        {keyNotes.length > 0 && (
          <section>
            <SectionHeader icon={Brain} title="Indicaciones clave" color="text-amber-500" />
            <div className="space-y-2.5">
              {keyNotes.map((note, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
                  <div className="size-2 rounded-full bg-amber-400 flex-shrink-0 mt-2.5" />
                  <p className="text-base text-amber-900">{note}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Seguimiento */}
        {(patient.tracking_home || patient.tracking_training) && (
          <section>
            <SectionHeader icon={BarChart2} title="Seguimiento" color="text-blue-500" />
            <div className="grid gap-3">
              {patient.tracking_home && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4">
                  <p className="text-xs font-medium text-blue-500 mb-2">🏠 En casa</p>
                  <p className="text-base text-[var(--foreground)] whitespace-pre-wrap">{patient.tracking_home}</p>
                </div>
              )}
              {patient.tracking_training && (
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4">
                  <p className="text-xs font-medium text-blue-500 mb-2">🏋️ En entrenamiento</p>
                  <p className="text-base text-[var(--foreground)] whitespace-pre-wrap">{patient.tracking_training}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Sesiones */}
        {(done > 0 || total != null) && (
          <section>
            <SectionHeader icon={Zap} title="Sesiones" color="text-[var(--accent-teal)]" />
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <div className="px-5 py-5">
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-medium text-[var(--accent-teal)]">{done}</span>
                  {total != null && <span className="text-lg text-[var(--muted-foreground)] mb-1">/ {total}</span>}
                </div>
                <p className="text-sm text-[var(--muted-foreground)]">
                  sesiones realizadas{remaining != null && remaining > 0 ? ` · ${remaining} restantes` : remaining === 0 ? ' · ¡Pack completo!' : ''}
                </p>
                {pct != null && (
                  <div className="mt-4 h-2.5 bg-[var(--muted)] rounded-full overflow-hidden">
                    <div className="h-full bg-[var(--accent-teal)] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
              {sessions.length > 0 && (
                <div className="border-t border-[var(--border)] px-5 py-4">
                  <div className="flex flex-wrap gap-2">
                    {[...sessions].reverse().map((s, i) => (
                      <div key={s.id} className="flex items-center gap-1.5 rounded-full bg-[var(--accent-teal-light)] text-[var(--accent-teal)] px-3 py-1">
                        <span className="text-xs font-medium">#{sessions.length - i}</span>
                        <span className="text-xs">
                          {new Date(s.session_date + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Recursos */}
        {resources.length > 0 && (
          <section>
            <SectionHeader icon={ExternalLink} title="Recursos útiles" color="text-[var(--muted-foreground)]" />
            <div className="space-y-2">
              {resources.map((r, i) => (
                <a key={i} href={r.url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 py-3 hover:border-[var(--accent-teal)] transition-colors group">
                  <div className="size-8 rounded-lg bg-[var(--muted)] flex items-center justify-center flex-shrink-0">
                    <ExternalLink className="size-4 text-[var(--muted-foreground)]" />
                  </div>
                  <span className="text-base text-[var(--accent-teal)] group-hover:underline">{r.label || r.url}</span>
                </a>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  )
}
