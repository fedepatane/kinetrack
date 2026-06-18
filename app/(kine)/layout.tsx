import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { Sidebar } from '@/components/layout/sidebar'
import { Topbar } from '@/components/layout/topbar'
import { getSetting } from '@/lib/db/settings'

// Toda la sección requiere sesión y datos en vivo de la base: render dinámico,
// nunca estático en build (cuando el disco/DB todavía no está disponible).
export const dynamic = 'force-dynamic'

export default async function KineLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session.isLoggedIn) redirect('/login')

  const theme = (getSetting('theme') as 'light' | 'dark' | 'system') || 'system'
  const accent = getSetting('accent') ?? undefined

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">
      <Sidebar theme={theme} accent={accent} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
