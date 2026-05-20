'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Dumbbell, ClipboardList, LayoutDashboard, Tag } from 'lucide-react'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/pacientes', label: 'Pacientes', icon: Users },
  { href: '/rutinas', label: 'Rutinas', icon: ClipboardList },
  { href: '/ejercicios', label: 'Ejercicios', icon: Dumbbell },
  { href: '/categorias', label: 'Categorías', icon: Tag },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-56 flex-shrink-0 border-r border-[var(--sidebar-border)] bg-[var(--sidebar-bg)] flex flex-col">
      <div className="px-5 py-4 border-b border-[var(--sidebar-border)]">
        <span className="text-sm font-medium text-[var(--foreground)]">Kinetrack</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
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
    </aside>
  )
}
