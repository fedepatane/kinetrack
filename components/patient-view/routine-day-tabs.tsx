'use client'

import { useState } from 'react'
import type { DayWithBlocks } from '@/lib/db/queries/routines'
import { CollapsibleBlock } from './routine-blocks'

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
      <div className="space-y-3">
        {day.blocks.map(block => (
          <CollapsibleBlock key={block.id} block={block} />
        ))}
      </div>
    </div>
  )
}
