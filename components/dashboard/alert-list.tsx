'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { addPatientSession } from '@/lib/db/actions/patient-sessions'
import {
  ChevronDown, ChevronRight, AlertTriangle, Clock,
  UserX, ExternalLink, CalendarPlus, Check,
} from 'lucide-react'

export interface AlertItemData {
  id: string
  name: string
  badgeText: string
  badgeVariant: 'amber' | 'red' | 'gray'
  consultationReason: string | null
  done: number | null
  total: number | null
  remaining: number | null
  lastSession: string | null
  daysSince: number | null
  routines: { id: string; name: string }[]
  lastRoutineName: string | null
  lastRoutineStatus: string | null
  canRegister: boolean
  canAssign: boolean
}

function fmtDate(s: string | null) {
  if (!s) return '—'
  return new Date(s + 'T12:00:00').toLocaleDateString('es-AR', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  })
}

function RegisterButton({ patientId }: { patientId: string }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [done, setDone] = useState(false)
  const [, startTransition] = useTransition()

  if (done) {
    return (
      <span className="flex items-center gap-1.5 text-xs text-[var(--accent-teal)] font-medium">
        <Check className="size-3.5" /> Registrada
      </span>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="date" value={date} onChange={e => setDate(e.target.value)}
        className="rounded border border-[var(--border)] bg-[var(--background)] px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]"
      />
      <button
        onClick={() => startTransition(async () => { await addPatientSession(patientId, date); setDone(true) })}
        className="flex items-center gap-1 rounded bg-[var(--accent-teal)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 transition-opacity"
      >
        <CalendarPlus className="size-3" /> Registrar sesión
      </button>
    </div>
  )
}

function ItemDetail({ item }: { item: AlertItemData }) {
  return (
    <div className="px-4 pb-4 pt-3 border-t border-[var(--border)] bg-[var(--muted)]/40 space-y-3">

      {item.consultationReason && (
        <div>
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-0.5">Motivo de consulta</p>
          <p className="text-sm">{item.consultationReason}</p>
        </div>
      )}

      {item.done !== null && item.total !== null && (
        <div>
          <div className="flex justify-between text-xs mb-1.5">
            <span className="font-semibold text-[var(--muted-foreground)] uppercase tracking-wide">Sesiones</span>
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

      {item.lastSession !== null && (
        <div>
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-0.5">Última sesión</p>
          <p className="text-sm">{fmtDate(item.lastSession)}</p>
          {item.daysSince !== null && item.daysSince > 0 && (
            <p className="text-xs text-[var(--muted-foreground)] mt-0.5">hace {item.daysSince} días</p>
          )}
        </div>
      )}

      {item.routines.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-1.5">
            Rutina{item.routines.length !== 1 ? 's' : ''} activa{item.routines.length !== 1 ? 's' : ''}
          </p>
          <div className="flex flex-wrap gap-1.5">
            {item.routines.map(r => (
              <Link key={r.id} href={`/rutinas/${r.id}`}
                className="text-xs bg-[var(--accent-teal-light)] text-[var(--accent-teal)] px-2.5 py-1 rounded-full font-medium hover:opacity-75 transition-opacity">
                {r.name}
              </Link>
            ))}
          </div>
        </div>
      )}

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

      <div className="pt-2 border-t border-[var(--border)] flex items-center gap-4 flex-wrap">
        <Link href={`/pacientes/${item.id}`}
          className="flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <ExternalLink className="size-3" /> Ver perfil completo
        </Link>
        {item.canRegister && <RegisterButton patientId={item.id} />}
        {item.canAssign && (
          <Link href={`/pacientes/${item.id}`}
            className="flex items-center gap-1.5 rounded bg-[var(--accent-teal)] px-2.5 py-1 text-xs font-medium text-white hover:opacity-90 transition-opacity">
            <CalendarPlus className="size-3" /> Asignar rutina
          </Link>
        )}
      </div>
    </div>
  )
}

const sectionIcons = {
  'low-sessions': AlertTriangle,
  'inactive': Clock,
  'no-routine': UserX,
}

const badgeClasses = {
  amber: 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)]',
  red: 'bg-red-50 text-red-600',
  gray: 'bg-[var(--muted)] text-[var(--muted-foreground)]',
}

const sectionIconClasses = {
  'low-sessions': 'text-[var(--accent-amber)]',
  'inactive': 'text-[var(--muted-foreground)]',
  'no-routine': 'text-[var(--muted-foreground)]',
}

export function AlertList({
  title,
  type,
  items,
}: {
  title: string
  type: 'low-sessions' | 'inactive' | 'no-routine'
  items: AlertItemData[]
}) {
  const [sectionOpen, setSectionOpen] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (items.length === 0) return null

  const SectionIcon = sectionIcons[type]

  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">

      {/* Header de sección — clickeable */}
      <button
        type="button"
        onClick={() => { setSectionOpen(v => !v); setExpandedId(null) }}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-[var(--muted)] transition-colors border-b border-[var(--border)]"
      >
        <SectionIcon className={`size-3.5 flex-shrink-0 ${sectionIconClasses[type]}`} />
        <span className="flex-1 text-sm font-medium">{title}</span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${type === 'low-sessions' ? 'bg-[var(--accent-amber-light)] text-[var(--accent-amber)]' : 'bg-[var(--muted)] text-[var(--muted-foreground)]'}`}>
          {items.length}
        </span>
        <ChevronDown className={`size-4 text-[var(--muted-foreground)] flex-shrink-0 transition-transform duration-200 ${sectionOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Lista de pacientes */}
      {sectionOpen && (
        <div>
          {items.map((item, idx) => (
            <div key={item.id} className={idx > 0 ? 'border-t border-[var(--border)]' : ''}>

              {/* Fila de paciente — clickeable */}
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--muted)]/60 transition-colors"
              >
                <ChevronRight className={`size-3.5 text-[var(--muted-foreground)] flex-shrink-0 transition-transform duration-200 ${expandedId === item.id ? 'rotate-90' : ''}`} />
                <span className="flex-1 text-sm">{item.name}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${badgeClasses[item.badgeVariant]}`}>
                  {item.badgeText}
                </span>
              </button>

              {/* Detalle expandido */}
              {expandedId === item.id && <ItemDetail item={item} />}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
