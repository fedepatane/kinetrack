'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

export function VideoModal({
  embedUrl,
  title,
  children,
}: {
  embedUrl: string
  title: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <span onClick={() => setOpen(true)}>{children}</span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl bg-black rounded-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setOpen(false)}
              className="absolute top-2 right-2 z-10 text-white/80 hover:text-white transition-colors"
            >
              <X className="size-5" />
            </button>
            <div className="aspect-video">
              <iframe
                src={`${embedUrl}?autoplay=1`}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </div>
      )}
    </>
  )
}
