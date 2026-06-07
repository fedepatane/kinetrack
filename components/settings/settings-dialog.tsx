'use client'

import { useState, useEffect, useActionState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { X, Sun, Moon, Monitor, Check, LogOut } from 'lucide-react'
import { changePassword, signOut } from '@/lib/db/actions/auth'
import { setThemeSetting, setAccentSetting } from '@/lib/db/actions/settings'

type Theme = 'light' | 'dark' | 'system'

const ACCENTS: { name: string; color: string }[] = [
  { name: 'Verde', color: '#1D9E75' },
  { name: 'Cyan', color: '#0891b2' },
  { name: 'Azul', color: '#2563eb' },
  { name: 'Violeta', color: '#7c3aed' },
  { name: 'Rosa', color: '#db2777' },
  { name: 'Rojo', color: '#dc2626' },
  { name: 'Naranja', color: '#ea580c' },
  { name: 'Ámbar', color: '#d97706' },
]
const DEFAULT_ACCENT = '#1D9E75'

// Aplica el tema en vivo en el DOM (la persistencia va a la base).
function applyTheme(t: Theme) {
  const dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', dark)
}

function applyAccent(color: string) {
  const s = document.documentElement.style
  s.setProperty('--accent-teal', color)
  s.setProperty('--accent-teal-light', `color-mix(in srgb, ${color} 14%, transparent)`)
}

export function SettingsDialog({
  open,
  onClose,
  initialTheme = 'system',
  initialAccent = DEFAULT_ACCENT,
}: {
  open: boolean
  onClose: () => void
  initialTheme?: Theme
  initialAccent?: string
}) {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [accent, setAccent] = useState<string>(initialAccent)
  const [mounted, setMounted] = useState(false)
  const [pwState, pwAction, pwPending] = useActionState(changePassword, null)
  const [, startTransition] = useTransition()

  useEffect(() => { setMounted(true) }, [])

  if (!open || !mounted) return null

  function pickTheme(t: Theme) { setTheme(t); applyTheme(t); startTransition(() => setThemeSetting(t)) }
  function pickAccent(c: string) { setAccent(c); applyAccent(c); startTransition(() => setAccentSetting(c)) }

  const themeOptions: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: 'light', label: 'Claro', icon: Sun },
    { value: 'dark', label: 'Oscuro', icon: Moon },
    { value: 'system', label: 'Sistema', icon: Monitor },
  ]

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] sticky top-0 bg-[var(--card)]">
          <h2 className="text-sm font-semibold">Configuración</h2>
          <button onClick={onClose} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            <X className="size-4" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          {/* Tema */}
          <section>
            <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Tema</h3>
            <div className="grid grid-cols-3 gap-2">
              {themeOptions.map(({ value, label, icon: Icon }) => (
                <button
                  key={value}
                  onClick={() => pickTheme(value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-xs transition-colors ${
                    theme === value
                      ? 'border-[var(--accent-teal)] bg-[var(--accent-teal-light)] text-[var(--accent-teal)] font-medium'
                      : 'border-[var(--border)] text-[var(--muted-foreground)] hover:border-[var(--accent-teal)]'
                  }`}
                >
                  <Icon className="size-4" />
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Color principal */}
          <section>
            <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Color principal</h3>
            <div className="flex flex-wrap gap-2.5">
              {ACCENTS.map(({ name, color }) => (
                <button
                  key={color}
                  onClick={() => pickAccent(color)}
                  title={name}
                  className={`size-8 rounded-full transition-transform hover:scale-110 flex items-center justify-center ${
                    accent.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-offset-2 ring-offset-[var(--card)] ring-[var(--foreground)]' : ''
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {accent.toLowerCase() === color.toLowerCase() && <Check className="size-4 text-white" />}
                </button>
              ))}
            </div>
          </section>

          {/* Contraseña */}
          <section>
            <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Cambiar contraseña</h3>
            <form action={pwAction} className="space-y-2">
              <input type="password" name="current" placeholder="Contraseña actual" autoComplete="current-password"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
              <input type="password" name="next" placeholder="Nueva contraseña" autoComplete="new-password"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
              <input type="password" name="confirm" placeholder="Repetir nueva contraseña" autoComplete="new-password"
                className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
              {pwState?.error && <p className="text-xs text-red-500">{pwState.error}</p>}
              {pwState?.ok && <p className="text-xs text-[var(--accent-teal)] flex items-center gap-1"><Check className="size-3" /> Contraseña actualizada.</p>}
              <button type="submit" disabled={pwPending}
                className="rounded-md bg-[var(--accent-teal)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity">
                {pwPending ? 'Guardando...' : 'Actualizar contraseña'}
              </button>
            </form>
          </section>

          {/* Sesión */}
          <section className="border-t border-[var(--border)] pt-4">
            <form action={signOut}>
              <button type="submit"
                className="inline-flex items-center gap-1.5 text-sm text-red-500 hover:text-red-600 transition-colors">
                <LogOut className="size-4" /> Cerrar sesión
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>,
    document.body,
  )
}
