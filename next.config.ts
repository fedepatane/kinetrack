import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['better-sqlite3'],
  // Permite acceder desde otros dispositivos en la red local (ej. el celular) en dev
  allowedDevOrigins: ['192.168.1.3'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },
}

export default nextConfig
