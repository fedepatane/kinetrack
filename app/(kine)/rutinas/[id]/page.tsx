import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getRoutineWithBlocks } from '@/lib/db/queries/routines'
import { ArrowLeft, Clock, Pencil, ExternalLink } from 'lucide-react'
import { DeleteButton } from '@/components/ui/delete-button'
import { deleteRoutine } from '@/lib/db/actions/routines'
import { DuplicateRoutineButton } from '@/components/routines/duplicate-button'
import { formatDose, resolveMedia } from '@/lib/utils'
import { MediaLauncher } from '@/components/patient-view/media-launcher'
import { PublicLinkCopy } from '@/components/patients/public-link-copy'
import Image from 'next/image'

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
                const media = resolveMedia(ex?.video_url, ex?.thumbnail_url)
                const thumb = media?.thumb ?? null
                const color = ex?.category_color
                return (
                  <div key={be.id} className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2.5"
                    style={color ? { borderLeftColor: color, borderLeftWidth: 4 } : undefined}>
                    <div className="w-16 h-10 rounded bg-[var(--muted)] flex-shrink-0 overflow-hidden relative">
                      {media ? (
                        <MediaLauncher media={media} title={ex?.name ?? ''}>
                          <button className="absolute inset-0 w-full h-full cursor-pointer">
                            {thumb && <Image src={thumb} alt={ex?.name ?? ''} width={64} height={40} className="object-cover w-full h-full" />}
                            <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/25 transition-colors">
                              <span className="text-white/80 text-xs drop-shadow">{media.mode === 'image' ? '⤢' : '▶'}</span>
                            </div>
                          </button>
                        </MediaLauncher>
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
          <div className="flex items-center justify-between mb-2 gap-2">
            <p className="text-xs text-[var(--muted-foreground)]">Link para compartir</p>
            <a
              href={`/r/${routine.public_token}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--accent-teal)] hover:opacity-80 transition-opacity flex-shrink-0"
            >
              <ExternalLink className="size-3.5" /> Ver como el paciente
            </a>
          </div>
          <PublicLinkCopy path={`/r/${routine.public_token}`} />
        </div>
      )}

      <div className="mb-8">
        <div className="flex items-start gap-3 mb-2 flex-wrap">
          <h1 className="text-lg font-medium flex-1">{routine.name}</h1>
          {routine.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full font-medium bg-[var(--accent-teal)]/15 text-[var(--accent-teal)]">{tag}</span>
          ))}
        </div>
        <div className="flex gap-4 text-sm text-[var(--muted-foreground)]">
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
