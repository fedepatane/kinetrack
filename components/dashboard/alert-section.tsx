'use client'

import { useState, useTransition } from 'react'
import { addPatientSession } from '@/lib/db/actions/patient-sessions'
import Link from 'next/link'
import {
  ChevronDown, ChevronUp, ExternalLink,
  CalendarPlus, Check, AlertTriangle, Clock, UserX,
} from 'lucide-react'

export interface RoutineRef { id: string; name: string }

export interface AlertItem {
  id: string
  first_name: string
  last_name: string
  badgeText: string
  badgeVariant: 'danger' | 'warning' | 'muted'

  // campos de detalle — todos opcionales, se muestran si existen
  consultationReason: string | null
  lastSession: string | null
  done: number | null
  total: number | null
  remaining: number | null
  daysSince: number | null
  activeRoutines: RoutineRef[]
  lastRoutineName: string | null
  lastRoutineStatus: string | null

  // qué acciones mostrar
  showRegister: boolean
  showAssign: boolean
}

/* ── mini form de sesión rápida ── */
function QuickRegister({ patientId }: { patientId: string }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [done, setDone] = useState(false)
  const [, startTransition] = useTransition()

  function handleRegister() {
    startTransition(async () => {
      await addPatientSession(patientId, date)
      setDone(true)
      setTimeout(() => setDone(false), 2000)
    })
  }

  if (done) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[var(--accent-teal)] font-medium">
        <Check className="size-3.5" /> Sesión registrada
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={date}
        onChange={e => setDate(e.target.value)}
        className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
      />
      <button
        onClick={handleRegister}
        className="flex items-center gap-1 rounded bg-[var(--accent-teal)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 transition-opacity"
      >
        <CalendarPlus className="size-3" /> Registrar sesión
      </button>
    </div>
  )
}

/* ── panel de detalle ── */
function DetailPanel({ item }: { item: AlertItem }) {
  function fmtDate(s: string | null) {
    if (!s) return '—'
    return new Date(s + 'T12:00:00').toLocaleDateString('es-AR', {
      weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    })
  }

  return (
    <div className="border-t border-[var(--border)] bg-[var(--muted)]/50">
      <div className="px-5 py-4 space-y-3">

        {/* Motivo de consulta */}
        {item.consultationReason && (
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-0.5">Motivo de consulta</p>
            <p className="text-sm">{item.consultationReason}</p>
          </div>
        )}

        {/* Progreso de sesiones */}
        {item.done !== null && item.total !== null && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <p className="font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Sesiones</p>
              <span className="font-medium">{item.done} / {item.total}</span>
            </div>
            <div className="h-2 bg-[var(--muted)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${item.remaining === 0 ? 'bg-red-400' : 'bg-[var(--accent-amber)]'}`}
                style={{ width: `${item.total > 0 ? Math.min(100, Math.round((item.done / item.total) * 100)) : 0}%` }}
              />
            </div>
            {item.remaining !== null && (
              <p className={`text-xs font-medium mt-1 ${item.remaining === 0 ? 'text-red-500' : 'text-[var(--accent-amber)]'}`}>
                {item.remaining === 0 ? 'Pack agotado — renovar' : `Quedan ${item.remaining} sesión${item.remaining !== 1 ? 'es' : ''}`}
              </p>
            )}
          </div>
        )}

        {/* Última sesión */}
        {(item.lastSession !== undefined) && (
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-0.5">Última sesión</p>
            <p className="text-sm">{fmtDate(item.lastSession)}</p>
            {item.daysSince !== null && item.daysSince > 0 && (
              <p className="text-xs text-[var(--muted-foreground)] mt-0.5">hace {item.daysSince} días</p>
            )}
          </div>
        )}

        {/* Rutinas activas */}
        {item.activeRoutines.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1.5">
              Rutina{item.activeRoutines.length !== 1 ? 's' : ''} activa{item.activeRoutines.length !== 1 ? 's' : ''}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {item.activeRoutines.map(r => (
                <Link
                  key={r.id}
                  href={`/rutinas/${r.id}`}
                  className="inline-flex items-center gap-1 text-xs bg-[var(--accent-teal-light)] text-[var(--accent-teal)] px-2.5 py-1 rounded-full font-medium hover:opacity-75 transition-opacity"
                >
                  {r.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Última rutina (para sin-rutina) */}
        {item.lastRoutineName && (
          <div>
            <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-0.5">Última rutina</p>
            <p className="text-sm">
              {item.lastRoutineName}{' '}
              <span className="text-[var(--muted-foreground)]">
                ({item.lastRoutineStatus === 'completed' ? 'completada' : 'pausada'})
              </span>
            </p>
          </div>
        )}

        {/* Acciones */}
        <div className="pt-2 border-t border-[var(--border)] flex items-center gap-4 flex-wrap">
          <Link
            href={`/pacientes/${item.id}`}
            className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            <ExternalLink className="size-3" /> Ver perfil completo
          </Link>

          {item.showRegister && <QuickRegister patientId={item.id} />}

          {item.showAssign && (
            <Link
              href={`/pacientes/${item.id}`}
              className="flex items-center gap-1.5 rounded bg-[var(--accent-teal)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 transition-opacity"
            >
              <CalendarPlus className="size-3" /> Asignar rutina
            </Link>
          )}
        </div>

      </div>
    </div>
  )
}

/* ── mapa de íconos ── */
const ICONS = {
  'alert-triangle': AlertTriangle,
  'clock': Clock,
  'user-x': UserX,
} as const

const BADGE_CLASSES = {
  danger:  'bg-red-50 text-red-600',
  warning: 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)]',
  muted:   'bg-[var(--muted)] text-[var(--muted-foreground)]',
}

/* ── sección principal ── */
export function AlertSection({
  title,
  icon,
  iconClass,
  items,
}: {
  title: string
  icon: keyof typeof ICONS
  iconClass: string
  items: AlertItem[]
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const Icon = ICONS[icon]

  if (items.length === 0) return null

  return (
    <section className="rounded-lg border border-[var(--border)] bg-[var(--card)]">

      {/* Cabecera */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[var(--border)]">
        <Icon className={`size-3.5 ${iconClass}`} />
        <h2 className="text-sm font-medium">{title}</h2>
        <span className="ml-auto text-xs text-[var(--muted-foreground)]">{items.length}</span>
      </div>

      {/* Filas */}
      {items.map((item, idx) => {
        const isExpanded = expandedId === item.id
        return (
          <div key={item.id} className={idx > 0 ? 'border-t border-[var(--border)]' : ''}>

            {/* Fila clickeable */}
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : item.id)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--muted)]/40 transition-colors text-left cursor-pointer"
            >
              <div className="flex-shrink-0 text-[var(--muted-foreground)]">
                {isExpanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
              </div>
              <span className="flex-1 text-sm text-[var(--foreground)]">
                {item.first_name} {item.last_name}
              </span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${BADGE_CLASSES[item.badgeVariant]}`}>
                {item.badgeText}
              </span>
            </button>

            {/* Panel de detalle */}
            {isExpanded && <DetailPanel item={item} />}

          </div>
        )
      })}

    </section>
  )
}
