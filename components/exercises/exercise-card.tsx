'use client'

import { useState } from 'react'
import type { Exercise } from '@/lib/db/types'
import { getYoutubeThumbnail, getYoutubeEmbedUrl } from '@/lib/utils'
import { VideoModal } from '@/components/patient-view/video-modal'
import Image from 'next/image'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import { DeleteButton } from '@/components/ui/delete-button'
import { deleteExercise } from '@/lib/db/actions/exercises'

export function ExerciseCard({ exercise }: { exercise: Exercise }) {
  const thumb = exercise.thumbnail_url ??
    (exercise.video_url ? getYoutubeThumbnail(exercise.video_url) : null)
  const embedUrl = exercise.video_url ? getYoutubeEmbedUrl(exercise.video_url) : null
  const [imgOk, setImgOk] = useState(true)

  return (
    <div className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <div className="w-24 h-14 rounded-md overflow-hidden bg-[var(--muted)] flex-shrink-0 relative">
        {embedUrl ? (
          <VideoModal embedUrl={embedUrl} title={exercise.name}>
            <button className="absolute inset-0 w-full h-full cursor-pointer">
              {thumb && imgOk && (
                <Image src={thumb} alt={exercise.name} width={96} height={56}
                  className="object-cover w-full h-full" onError={() => setImgOk(false)} />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/25 transition-colors">
                <span className="text-white/80 text-base drop-shadow">▶</span>
              </div>
            </button>
          </VideoModal>
        ) : thumb && imgOk ? (
          <Image src={thumb} alt={exercise.name} width={96} height={56}
            className="object-cover w-full h-full" onError={() => setImgOk(false)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] text-xs">
            Sin video
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)] truncate">{exercise.name}</p>
        {exercise.description && (
          <p className="text-xs text-[var(--muted-foreground)] truncate mt-0.5">{exercise.description}</p>
        )}
        {exercise.tags.length > 0 && (
          <div className="flex gap-1 mt-1.5 flex-wrap">
            {exercise.tags.map(tag => (
              <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-[var(--muted)] text-[var(--muted-foreground)]">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <Link
          href={`/ejercicios/${exercise.id}/editar`}
          className="p-1.5 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          <Pencil className="size-3.5" />
        </Link>
        <DeleteButton
          onDelete={() => deleteExercise(exercise.id)}
          confirm={`¿Eliminar "${exercise.name}"? No se puede deshacer.`}
        />
      </div>
    </div>
  )
}
