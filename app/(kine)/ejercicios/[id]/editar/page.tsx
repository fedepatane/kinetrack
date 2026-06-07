import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getExercise } from '@/lib/db/queries/exercises'
import { getCategories } from '@/lib/db/queries/categories'
import { updateExercise } from '@/lib/db/actions/exercises'
import { CategorySelect } from '@/components/exercises/category-select'
import { ArrowLeft } from 'lucide-react'

export default async function EditExercisePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const [exercise, categories] = [getExercise(id), getCategories()]
  if (!exercise) notFound()

  const action = updateExercise.bind(null, id)

  return (
    <div className="max-w-lg">
      <Link href="/ejercicios"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] mb-6 transition-colors">
        <ArrowLeft className="size-3.5" /> Ejercicios
      </Link>

      <h1 className="text-lg font-medium mb-6">Editar ejercicio</h1>

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm mb-1.5">Nombre</label>
          <input id="name" name="name" type="text" required defaultValue={exercise.name}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm mb-1.5">Descripción</label>
          <textarea id="description" name="description" rows={3} defaultValue={exercise.description ?? ''}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)] resize-none" />
        </div>

        {categories.length > 0 && (
          <CategorySelect categories={categories} defaultValue={exercise.category_id ?? ''} />
        )}

        <div>
          <label htmlFor="video_url" className="block text-sm mb-1.5">URL del video</label>
          <input id="video_url" name="video_url" type="url" defaultValue={exercise.video_url ?? ''}
            placeholder="YouTube, Vimeo, Drive, .mp4… cualquier link público"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
          <p className="text-xs text-[var(--muted-foreground)] mt-1">YouTube, Vimeo, Google Drive, Loom y archivos (.mp4/.webm) se ven dentro de la app. Otros links se abren en una pestaña nueva.</p>
        </div>

        <div>
          <label htmlFor="thumbnail_url" className="block text-sm mb-1.5">Miniatura (opcional)</label>
          <input id="thumbnail_url" name="thumbnail_url" type="url" defaultValue={exercise.thumbnail_url ?? ''}
            placeholder="URL de una imagen para la miniatura"
            className="w-full rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-teal)]" />
          <p className="text-xs text-[var(--muted-foreground)] mt-1">Si lo dejás vacío, se intenta tomar la imagen de la página del video automáticamente.</p>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit"
            className="rounded-md bg-[var(--accent-teal)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
            Guardar cambios
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
