import { createExercise } from '@/lib/db/actions/exercises'
import { getCategories } from '@/lib/db/queries/categories'
import { CategorySelect } from '@/components/exercises/category-select'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NuevoEjercicioPage() {
  const categories = getCategories()

  return (
    <div className="max-w-lg">
      <Link href="/ejercicios"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors">
        <ArrowLeft className="size-3.5" /> Ejercicios
      </Link>

      <h1 className="text-lg font-medium mb-6">Nuevo ejercicio</h1>

      <form action={createExercise} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm mb-1.5">Nombre</label>
          <input id="name" name="name" type="text" required
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm mb-1.5">Descripción</label>
          <textarea id="description" name="description" rows={3}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)] resize-none" />
        </div>

        {categories.length > 0 && <CategorySelect categories={categories} />}

        <div>
          <label htmlFor="video_url" className="block text-sm mb-1.5">URL de YouTube</label>
          <input id="video_url" name="video_url" type="url"
            placeholder="https://youtube.com/watch?v=..."
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
        </div>

        <div>
          <label htmlFor="tags" className="block text-sm mb-1.5">Tags (separados por coma)</label>
          <input id="tags" name="tags" type="text" placeholder="hombro, movilidad"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="rounded-md bg-[var(--accent-teal)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
            Crear ejercicio
          </button>
          <Link href="/ejercicios"
            className="rounded-md border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
