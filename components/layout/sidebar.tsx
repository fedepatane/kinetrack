'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { Users, Dumbbell, ClipboardList, LayoutDashboard, Tag, Settings, Menu, X } from 'lucide-react'
import { SettingsDialog } from '@/components/settings/settings-dialog'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pacientes', label: 'Pacientes', icon: Users },
  { href: '/rutinas', label: 'Rutinas', icon: ClipboardList },
  { href: '/ejercicios', label: 'Ejercicios', icon: Dumbbell },
  { href: '/categorias', label: 'Categorías', icon: Tag },
]

export function Sidebar({ theme, accent }: { theme?: 'light' | 'dark' | 'system'; accent?: string }) {
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Cerrar el drawer al navegar
  useEffect(() => { setMobileOpen(false) }, [pathname])

  function Inner({ showClose = false }: { showClose?: boolean }) {
    return (
      <>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--sidebar-border)]">
          <span className="text-sm font-medium text-[var(--foreground)]">Kinetrack</span>
          {showClose && (
            <button onClick={() => setMobileOpen(false)} className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <X className="size-4" />
            </button>
          )}
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {nav.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-[var(--accent-teal-light)] text-[var(--accent-teal)] font-medium'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]'
                }`}
              >
                <Icon className="size-4 flex-shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="px-3 py-4 border-t border-[var(--sidebar-border)]">
          <button
            onClick={() => { setSettingsOpen(true); setMobileOpen(false) }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <Settings className="size-4 flex-shrink-0" />
            Configuración
          </button>
        </div>
      </>
    )
  }

  return (
    <>
      {/* Sidebar fijo en escritorio */}
      <aside className="hidden md:flex w-56 flex-shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex-col">
        <Inner />
      </aside>

      {/* Botón hamburguesa en móvil */}
      <button
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú"
        className="md:hidden fixed top-2 left-2 z-30 p-2 rounded-md text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
      >
        <Menu className="size-5" />
      </button>

      {/* Drawer móvil */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileOpen(false)} />
      )}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 z-50 w-64 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex flex-col transform transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <Inner showClose />
      </aside>

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} initialTheme={theme} initialAccent={accent} />
    </>
  )
}
