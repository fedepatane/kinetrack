import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Kinetrack',
  description: 'Gestión de pacientes y rutinas de kinesiología',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  )
}
