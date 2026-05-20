import { notFound } from 'next/navigation'
import { getRoutineWithBlocks } from '@/lib/db/queries/routines'
import { db } from '@/lib/db'
import type { Routine } from '@/lib/db/types'
import { Clock, ChevronLeft } from 'lucide-react'
import { RoutineDayTabs } from '@/components/patient-view/routine-day-tabs'
import { VideoModal } from '@/components/patient-view/video-modal'
import { formatDose, getYoutubeThumbnail, getYoutubeEmbedUrl } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'

const difficultyConfig: Record<string, { label: string; color: string; bg: string }> = {
  suave:    { label: 'suave',    color: 'text-emerald-700', bg: 'bg-emerald-100' },
  moderado: { label: 'moderado', color: 'text-amber-700',   bg: 'bg-amber-100'   },
  intenso:  { label: 'intenso',  color: 'text-red-600',     bg: 'bg-red-100'     },
}

export default async function PublicRoutinePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  const routineRow = db
    .prepare(`SELECT * FROM routines WHERE public_token = ?`)
    .get(token) as Routine | null
  if (!routineRow) notFound()

  const routine = getRoutineWithBlocks(routineRow.id)
  if (!routine) notFound()

  const hasDays = routine.days.length > 0
  const diff = routine.difficulty ? difficultyConfig[routine.difficulty] : null

  return (
    <div className="min-h-screen bg-[var(--background)]">

      {/* Header con acento de color */}
      <header className="bg-[var(--accent-teal)] text-white">
        <div className="max-w-2xl mx-auto px-5 pt-8 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-medium">{routine.name}</h1>
              <div className="flex items-center gap-3 mt-2 text-white/80 text-sm flex-wrap">
                {routine.body_zone && <span>{routine.body_zone}</span>}
                {routine.estimated_minutes && (
                  <span className="flex items-center gap-1">
                    <Clock className="size-3.5" />{routine.estimated_minutes} min
                  </span>
                )}
                {hasDays && (
                  <span>{routine.days.length} días</span>
                )}
              </div>
              {routine.description && (
                <p className="mt-2 text-white/80 text-sm">{routine.description}</p>
              )}
            </div>
            {diff && (
              <span className={`text-xs px-3 py-1 rounded-full font-medium flex-shrink-0 ${diff.bg} ${diff.color}`}>
                {diff.label}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-5 py-8">
        {hasDays ? (
          <RoutineDayTabs days={routine.days} />
        ) : (
          <div className="space-y-8">
            {routine.blocks.map(block => (
              <div key={block.id}>
                <h2 className="text-sm font-medium text-[var(--muted-foreground)] uppercase tracking-wider mb-4">
                  {block.name}
                </h2>
                {block.notes && (
                  <p className="text-sm text-[var(--muted-foreground)] mb-3 italic">{block.notes}</p>
                )}
                <div className="space-y-3">
                  {[...block.block_exercises]
                    .sort((a, b) => a.order_index - b.order_index)
                    .map(be => {
                      const ex = be.exercise
                      const thumb = ex?.video_url ? getYoutubeThumbnail(ex.video_url) : null
                      const embedUrl = ex?.video_url ? getYoutubeEmbedUrl(ex.video_url) : null
                      return (
                        <div key={be.id} className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 hover:border-[var(--accent-teal)] transition-colors">
                          <div className="w-28 h-16 rounded-xl bg-[var(--muted)] flex-shrink-0 overflow-hidden relative">
                            {embedUrl ? (
                              <VideoModal embedUrl={embedUrl} title={ex?.name ?? ''}>
                                <button className="absolute inset-0 w-full h-full cursor-pointer">
                                  {thumb && <Image src={thumb} alt={ex?.name ?? ''} width={112} height={64} className="object-cover w-full h-full" />}
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/25 transition-colors">
                                    <span className="text-white/80 text-lg drop-shadow">▶</span>
                                  </div>
                                </button>
                              </VideoModal>
                            ) : thumb ? (
                              <Image src={thumb} alt={ex?.name ?? ''} width={112} height={64} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] text-xs">Sin video</div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-base">{ex?.name ?? '—'}</p>
                            <p className="text-sm text-[var(--accent-teal)] font-medium mt-0.5">{formatDose(be)}</p>
                            {ex?.description && (
                              <p className="text-sm text-[var(--muted-foreground)] mt-1 line-clamp-2">{ex.description}</p>
                            )}
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
