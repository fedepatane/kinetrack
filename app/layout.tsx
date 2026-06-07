import type { Metadata, Viewport } from 'next'
import './globals.css'
import { ThemeWatcher } from '@/components/settings/theme-watcher'
import { getSetting } from '@/lib/db/settings'

export const metadata: Metadata = {
  title: 'Kinetrack',
  description: 'Gestión de pacientes y rutinas de kinesiología',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

type Theme = 'light' | 'dark' | 'system'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = (getSetting('theme') as Theme) || 'system'
  const accent = getSetting('accent')

  // Aplica tema y color desde la base antes de pintar (sin parpadeo).
  const initScript = `(function(){try{
    var t = ${JSON.stringify(theme)};
    var dark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
    var c = ${JSON.stringify(accent)};
    if (c) {
      var s = document.documentElement.style;
      s.setProperty('--accent-teal', c);
      s.setProperty('--accent-teal-light', 'color-mix(in srgb, ' + c + ' 14%, transparent)');
    }
  }catch(e){}})();`

  return (
    <html lang="es" className="h-full" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: initScript }} />
      </head>
      <body className="h-full"><ThemeWatcher theme={theme} />{children}</body>
    </html>
  )
}
