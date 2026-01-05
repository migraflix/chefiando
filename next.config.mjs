/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Habilitar instrumentación para Sentry
  experimental: {
    instrumentationHook: true,
  },
}

export default nextConfig