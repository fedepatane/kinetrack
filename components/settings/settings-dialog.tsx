'use client'

import { useState, useEffect, useActionState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { X, Sun, Moon, Monitor, Check, LogOut, Download, Upload } from 'lucide-react'
import { changePassword, signOut } from '@/lib/db/actions/auth'
import { setThemeSetting, setAccentSetting } from '@/lib/db/actions/settings'
import { restoreBackup } from '@/lib/db/actions/backup'

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
  const [reState, reAction, rePending] = useActionState(restoreBackup, null)
  const [showRestore, setShowRestore] = useState(false)
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge' | null>(null)
  const [restoreFile, setRestoreFile] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  useEffect(() => { setMounted(true) }, [])

  // Tras restaurar con éxito, recargamos para que todo refleje los datos nuevos.
  useEffect(() => {
    if (reState?.ok) {
      const t = setTimeout(() => window.location.reload(), 1500)
      return () => clearTimeout(t)
    }
  }, [reState?.ok])

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

          {/* Copia de seguridad */}
          <section className="border-t border-[var(--border)] pt-4">
            <h3 className="text-xs font-semibold text-[var(--muted-foreground)] uppercase tracking-wide mb-2">Copia de seguridad</h3>
            <p className="text-xs text-[var(--muted-foreground)] mb-2.5">
              Descargá un archivo con todos tus datos (categorías, ejercicios, rutinas y pacientes) para guardarlo por las dudas.
            </p>
            <a
              href="/api/backup"
              download
              className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-[var(--accent-teal)] transition-colors"
            >
              <Download className="size-4" /> Descargar backup
            </a>

            {/* Restaurar */}
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              {!showRestore ? (
                <button
                  type="button"
                  onClick={() => setShowRestore(true)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-[var(--border)] px-4 py-2 text-sm font-medium hover:border-[var(--accent-teal)] transition-colors"
                >
                  <Upload className="size-4" /> Restaurar backup
                </button>
              ) : (
                <form
                  action={reAction}
                  onSubmit={(e) => {
                    if (restoreMode === 'replace' && !window.confirm('Esto va a BORRAR todos los datos actuales y cargarlos desde el backup. ¿Seguro?')) {
                      e.preventDefault()
                    }
                  }}
                  className="space-y-3"
                >
                  <label className="block">
                    <span className="text-xs font-medium text-[var(--muted-foreground)]">Elegí el archivo de backup (.json)</span>
                    <input
                      type="file"
                      name="file"
                      accept="application/json,.json"
                      onChange={(e) => setRestoreFile(e.target.files?.[0]?.name ?? null)}
                      className="mt-1 block w-full text-sm text-[var(--muted-foreground)] file:mr-3 file:rounded-md file:border-0 file:bg-[var(--muted)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--foreground)] hover:file:bg-[var(--accent-teal-light)]"
                    />
                  </label>

                  {restoreFile && (
                    <>
                      <input type="hidden" name="mode" value={restoreMode ?? ''} />
                      <div className="space-y-2">
                        <button
                          type="button"
                          onClick={() => setRestoreMode('merge')}
                          className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                            restoreMode === 'merge'
                              ? 'border-[var(--accent-teal)] bg-[var(--accent-teal-light)]'
                              : 'border-[var(--border)] hover:border-[var(--accent-teal)]'
                          }`}
                        >
                          <p className="text-sm font-medium">Fusionar</p>
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            Agrega lo que falte del backup sin tocar lo que ya tenés. No borra nada.
                          </p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRestoreMode('replace')}
                          className={`w-full text-left rounded-lg border px-3 py-2.5 transition-colors ${
                            restoreMode === 'replace'
                              ? 'border-red-400 bg-red-50'
                              : 'border-[var(--border)] hover:border-red-300'
                          }`}
                        >
                          <p className="text-sm font-medium text-red-600">Reemplazar</p>
                          <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                            Borra todos los datos actuales y los reemplaza por los del backup. Sirve para recuperar todo desde cero.
                          </p>
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="submit"
                          disabled={!restoreMode || rePending}
                          className="rounded-md bg-[var(--accent-teal)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                        >
                          {rePending ? 'Restaurando...' : 'Restaurar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => { setShowRestore(false); setRestoreMode(null); setRestoreFile(null) }}
                          className="text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  )}

                  {reState?.error && <p className="text-xs text-red-500">{reState.error}</p>}
                  {reState?.ok && (
                    <p className="text-xs text-[var(--accent-teal)] flex items-center gap-1">
                      <Check className="size-3" /> {reState.summary} Recargando…
                    </p>
                  )}
                </form>
              )}
            </div>
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
