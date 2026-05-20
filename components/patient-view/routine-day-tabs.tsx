'use client'

import { useState } from 'react'
import type { DayWithBlocks, BlockExerciseWithExercise } from '@/lib/db/queries/routines'
import { VideoModal } from './video-modal'
import { formatDose, getYoutubeThumbnail, getYoutubeEmbedUrl } from '@/lib/utils'
import Image from 'next/image'

function ExerciseRow({ be }: { be: BlockExerciseWithExercise }) {
  const ex = be.exercise
  if (!ex) return null
  const thumb = ex.video_url ? getYoutubeThumbnail(ex.video_url) : null
  const embedUrl = ex.video_url ? getYoutubeEmbedUrl(ex.video_url) : null

  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--border)] bg-[var(--card)] px-4 py-4 hover:border-[var(--accent-teal)] transition-colors">
      <div className="w-28 h-16 rounded-xl bg-[var(--muted)] flex-shrink-0 overflow-hidden relative">
        {embedUrl ? (
          <VideoModal embedUrl={embedUrl} title={ex.name}>
            <button className="absolute inset-0 w-full h-full cursor-pointer">
              {thumb && <Image src={thumb} alt={ex.name} width={112} height={64} className="object-cover w-full h-full" />}
              <div className="absolute inset-0 flex items-center justify-center bg-black/10 hover:bg-black/25 transition-colors">
                <span className="text-white/80 text-lg drop-shadow">▶</span>
              </div>
            </button>
          </VideoModal>
        ) : thumb ? (
          <Image src={thumb} alt={ex.name} width={112} height={64} className="object-cover w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[var(--muted-foreground)] text-xs">Sin video</div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-base">{ex.name}</p>
        <p className="text-sm text-[var(--accent-teal)] font-medium mt-0.5">{formatDose(be)}</p>
        {ex.description && (
          <p className="text-sm text-[var(--muted-foreground)] mt-1 line-clamp-2">{ex.description}</p>
        )}
      </div>
    </div>
  )
}

export function RoutineDayTabs({ days }: { days: DayWithBlocks[] }) {
  const [active, setActive] = useState(0)
  const day = days[active]

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-[var(--border)]">
        {days.map((d, i) => (
          <button
            key={d.id}
            onClick={() => setActive(i)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              i === active
                ? 'border-[var(--accent-teal)] text-[var(--accent-teal)]'
                : 'border-transparent text-[var(--muted-foreground)] hover:text-[var(--foreground)]'
            }`}
          >
            {d.name}
          </button>
        ))}
      </div>

      {/* Contenido del día activo */}
      <div className="space-y-8">
        {day.blocks.map(block => (
          <div key={block.id}>
            <p className="text-sm font-medium text-[var(--muted-foreground)] mb-3">{block.name}</p>
            {block.notes && (
              <p className="text-sm text-[var(--muted-foreground)] mb-3 italic">{block.notes}</p>
            )}
            <div className="space-y-2.5">
              {block.block_exercises
                .sort((a, b) => a.order_index - b.order_index)
                .map(be => <ExerciseRow key={be.id} be={be} />)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
