import { signOut } from '@/lib/db/actions/auth'

export function Topbar() {
  return (
    <header className="h-12 flex items-center justify-end border-b border-[var(--border)] px-4 md:px-6 pl-14 md:pl-6">
      <form action={signOut}>
        <button
          type="submit"
          className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          Salir
        </button>
      </form>
    </header>
  )
}
