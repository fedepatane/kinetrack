import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getRoutineWithBlocks } from '@/lib/db/queries/routines'
import { ArrowLeft, Clock, Pencil } from 'lucide-react'
import { DeleteButton } from '@/components/ui/delete-button'
import { deleteRoutine } from '@/lib/db/actions/routines'
import { DuplicateRoutineButton } from '@/components/routines/duplicate-button'
import { formatDose, getYoutubeThumbnail, getYoutubeEmbedUrl } from '@/lib/utils'
import { VideoModal } from '@/components/patient-view/video-modal'
import { PublicLinkCopy } from '@/components/patients/public-link-copy'
import Image from 'next/image'

const difficultyColors: Record<string, string> = {
  suave: 'text-[var(--accent-teal)] bg-[var(--accent-teal-light)]',
  moderado: 'text-[var(--accent-amber)] bg-[var(--accent-amber-light)]',
  intenso: 'text-red-600 bg-red-50',
}

import type { BlockWithExercises } from '@/lib/db/queries/routines'

function BlockList({ blocks }: { blocks: BlockWithExercises[] }) {
  return (
    <div className="space-y-6">
      {blocks.map(block => {
        const sortedBEs = [...block.block_exercises].sort((a, b) => a.order_index - b.order_index)
        return (
          <div key={block.id}>
            <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-2">{block.name}</p>
            {block.notes && <p className="text-xs text-[var(--muted-foreground)] mb-2 italic">{block.notes}</p>}
            <div className="space-y-2">
              {sortedBEs.map(be => {
                const ex = be.exercise
                const thumb = ex?.video_url ? getYoutubeThumbnail(ex.video_url) : null
                const embedUrl = ex?.video_url ? getYoutubeEmbedUrl(ex.video_url) : null
                return (
                  <div key={be.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5">
                    <div className="w-16 h-10 rounded bg-[var(--muted)] flex-shrink-0 overflow-hidden relative">
                      {embedUrl ? (
                        <VideoModal embedUrl={embedUrl} title={ex?.name ?? ''}>
                          <button className="absolute inset-0 w-full h-full cursor-pointer">
                            {thumb && <Image src={thumb} alt={ex?.name ?? ''} width={64} height={40} className="object-cover w-full h-full" />}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/25 transition-colors">
                              <span className="text-white/80 text-xs drop-shadow">▶</span>
                            </div>
                          </button>
                        </VideoModal>
                      ) : thumb ? (
                        <Image src={thumb} alt={ex?.name ?? ''} width={64} height={40} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] text-xs">—</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{ex?.name ?? '—'}</p>
                      <p className="text-xs text-[var(--muted-foreground)]">{formatDose(be)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default async function RoutineDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const routine = getRoutineWithBlocks(id)
  if (!routine) notFound()

  const hasDays = routine.days.length > 0

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <Link href="/rutinas" className="inline-flex items-center gap-1.5 text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors">
          <ArrowLeft className="size-3.5" /> Rutinas
        </Link>
        <div className="flex items-center gap-1">
          <Link
            href={`/rutinas/${routine.id}/editar`}
            className="inline-flex items-center gap-1.5 p-1.5 rounded text-sm text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            title="Editar"
          >
            <Pencil className="size-3.5" />
          </Link>
          <DuplicateRoutineButton routineId={routine.id} />
          <DeleteButton
            onDelete={deleteRoutine.bind(null, routine.id)}
            confirm={`¿Eliminar "${routine.name}"? Se quitará de todas las asignaciones activas.`}
          />
        </div>
      </div>

      {routine.public_token && (
        <div className="mb-6">
          <p className="text-xs text-[var(--muted-foreground)] mb-2">Link para compartir</p>
          <PublicLinkCopy url={`${process.env.NEXT_PUBLIC_APP_URL}/r/${routine.public_token}`} />
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-start gap-3 mb-2">
          <h1 className="text-lg font-medium flex-1">{routine.name}</h1>
          {routine.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${difficultyColors[routine.difficulty]}`}>{routine.difficulty}</span>
          )}
        </div>
        <div className="flex gap-4 text-sm text-[var(--muted-foreground)]">
          {routine.body_zone && <span>{routine.body_zone}</span>}
          {routine.estimated_minutes && (
            <span className="flex items-center gap-1"><Clock className="size-3.5" />{routine.estimated_minutes} min</span>
          )}
        </div>
        {routine.description && <p className="mt-2 text-sm text-[var(--muted-foreground)]">{routine.description}</p>}
      </div>

      {hasDays ? (
        <div className="space-y-8">
          {routine.days.map(day => (
            <div key={day.id}>
              <h2 className="text-base font-medium mb-4 pb-2 border-b border-[var(--border)]">{day.name}</h2>
              <BlockList blocks={day.blocks} />
            </div>
          ))}
        </div>
      ) : (
        <BlockList blocks={routine.blocks} />
      )}
    </div>
  )
}
