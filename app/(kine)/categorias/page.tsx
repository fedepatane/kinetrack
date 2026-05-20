import { getCategories } from '@/lib/db/queries/categories'
import { getExercises } from '@/lib/db/queries/exercises'
import { CategoryManager } from '@/components/categories/category-manager'

export default function CategoriasPage() {
  const categories = getCategories()
  const exercises = getExercises()

  return (
    <div className="max-w-2xl">
      <h1 className="text-lg font-medium mb-6">Categorías</h1>
      <CategoryManager categories={categories} exercises={exercises} />
    </div>
  )
}
