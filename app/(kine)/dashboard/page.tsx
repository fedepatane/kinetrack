import { db } from '@/lib/db'
import Link from 'next/link'
import { Users, ClipboardList, Dumbbell, Plus, CalendarCheck, TrendingUp } from 'lucide-react'
import { QuickSessionWidget } from '@/components/dashboard/quick-session-widget'

interface SimplePatient { id: string; first_name: string; last_name: string }
interface RecentSession extends SimplePatient { session_date: string; notes: string | null }

function greeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Buenos días'
  if (h < 19) return 'Buenas tardes'
  return 'Buenas noches'
}

function todayLabel() {
  return new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function DashboardPage() {

  const totalPatients  = (db.prepare(`SELECT COUNT(*) as c FROM patients`).get() as { c: number }).c
  const totalRoutines  = (db.prepare(`SELECT COUNT(*) as c FROM routines`).get() as { c: number }).c
  const totalExercises = (db.prepare(`SELECT COUNT(*) as c FROM exercises`).get() as { c: number }).c
  const activePatients = (db.prepare(`SELECT COUNT(DISTINCT patient_id) as c FROM assignments WHERE status='active'`).get() as { c: number }).c
  const sessionsWeek   = (db.prepare(`SELECT COUNT(*) as c FROM patient_sessions WHERE session_date >= date('now','-6 days')`).get() as { c: number }).c
  const sessionsMonth  = (db.prepare(`SELECT COUNT(*) as c FROM patient_sessions WHERE session_date >= date('now','start of month')`).get() as { c: number }).c

  const recentSessions = db.prepare(`
    SELECT ps.session_date, ps.notes, p.id as id, p.first_name, p.last_name
    FROM patient_sessions ps JOIN patients p ON p.id = ps.patient_id
    ORDER BY ps.session_date DESC, ps.created_at DESC LIMIT 8
  `).all() as RecentSession[]

  const allPatients = db.prepare(`SELECT id, first_name, last_name FROM patients ORDER BY first_name, last_name`).all() as SimplePatient[]
  const hasData = totalPatients > 0

  return (
    <div className="max-w-3xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-medium">{greeting()}</h1>
        <p className="text-sm text-[var(--muted-foreground)] capitalize mt-0.5">{todayLabel()}</p>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Link href="/pacientes/nuevo" className="flex items-center gap-2 justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)] transition-colors">
          <Plus className="size-4" /> Nuevo paciente
        </Link>
        <Link href="/rutinas/nueva" className="flex items-center gap-2 justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)] transition-colors">
          <Plus className="size-4" /> Nueva rutina
        </Link>
        {hasData
          ? <QuickSessionWidget patients={allPatients} />
          : <Link href="/ejercicios/nuevo" className="flex items-center gap-2 justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 text-sm font-medium hover:border-[var(--accent-teal)] hover:text-[var(--accent-teal)] transition-colors">
              <Plus className="size-4" /> Nuevo ejercicio
            </Link>
        }
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Link href="/pacientes" className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--accent-teal)] transition-colors">
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-[var(--muted-foreground)]">Pacientes</span><Users className="size-3.5 text-[var(--muted-foreground)]" /></div>
          <p className="text-2xl font-medium">{totalPatients}</p>
          {activePatients > 0 && <p className="text-xs text-[var(--accent-teal)] mt-1">{activePatients} activos</p>}
        </Link>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-[var(--muted-foreground)]">Esta semana</span><CalendarCheck className="size-3.5 text-[var(--muted-foreground)]" /></div>
          <p className="text-2xl font-medium">{sessionsWeek}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">sesiones</p>
        </div>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-[var(--muted-foreground)]">Este mes</span><TrendingUp className="size-3.5 text-[var(--muted-foreground)]" /></div>
          <p className="text-2xl font-medium">{sessionsMonth}</p>
          <p className="text-xs text-[var(--muted-foreground)] mt-1">sesiones</p>
        </div>
        <Link href="/rutinas" className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--accent-teal)] transition-colors">
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-[var(--muted-foreground)]">Rutinas</span><ClipboardList className="size-3.5 text-[var(--muted-foreground)]" /></div>
          <p className="text-2xl font-medium">{totalRoutines}</p>
        </Link>
        <Link href="/ejercicios" className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-4 hover:border-[var(--accent-teal)] transition-colors">
          <div className="flex items-center justify-between mb-2"><span className="text-xs text-[var(--muted-foreground)]">Ejercicios</span><Dumbbell className="size-3.5 text-[var(--muted-foreground)]" /></div>
          <p className="text-2xl font-medium">{totalExercises}</p>
        </Link>
      </div>

      {/* Actividad reciente */}
      {hasData && recentSessions.length > 0 && (
        <section className="rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <CalendarCheck className="size-3.5 text-[var(--accent-teal)]" />
              <h2 className="text-sm font-medium">Actividad reciente</h2>
            </div>
            <Link href="/pacientes" className="text-xs text-[var(--muted-foreground)] hover:text-[var(--accent-teal)] transition-colors">ver todos →</Link>
          </div>
          <div className="divide-y divide-[var(--border)]">
            {recentSessions.map((s, i) => {
              const d = new Date(s.session_date + 'T12:00:00')
              const today = new Date()
              const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
              const isToday = d.toDateString() === today.toDateString()
              const isYesterday = d.toDateString() === yesterday.toDateString()
              const label = isToday ? 'hoy' : isYesterday ? 'ayer'
                : d.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: '2-digit' })
              return (
                <Link key={i} href={`/pacientes/${s.id}`} className="flex items-center justify-between px-4 py-2.5 hover:bg-[var(--muted)]/40 transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="text-sm">{s.first_name} {s.last_name}</span>
                    {s.notes && <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">{s.notes}</p>}
                  </div>
                  <span className={`text-xs flex-shrink-0 ml-3 ${isToday ? 'text-[var(--accent-teal)] font-medium' : 'text-[var(--muted-foreground)]'}`}>{label}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* Estado vacío */}
      {!hasData && (
        <div className="rounded-lg border border-dashed border-[var(--border)] p-12 text-center space-y-3">
          <p className="text-sm font-medium">Empezá por agregar tu primer paciente</p>
          <p className="text-sm text-[var(--muted-foreground)]">Desde acá vas a poder gestionar pacientes, rutinas y sesiones.</p>
          <Link href="/pacientes/nuevo" className="inline-flex items-center gap-1.5 rounded-md bg-[var(--accent-teal)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
            <Plus className="size-4" /> Nuevo paciente
          </Link>
        </div>
      )}
    </div>
  )
}
