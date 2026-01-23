/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript: validar errores en build para detectar problemas temprano
  typescript: {
    ignoreBuildErrors: false,
  },

  // Imágenes: mantener sin optimización (útil para desarrollo)
  images: {
    unoptimized: true,
  },

  // Configuración de Turbopack para Next.js 16+
  turbopack: {
    // Configuraciones específicas de Turbopack
    rules: {
      '*.svg': {
        loaders: ['@svgr/webpack'],
        as: '*.js',
      },
    },
  },

  // Optimizaciones adicionales
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // Reducir tamaño del bundle con tree-shaking
  modularizeImports: {
    'lucide-react': {
      transform: 'lucide-react/{{member}}',
    },
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/{{member}}',
    },
  },

  // Configuración de build
  output: 'standalone',

  // Excluir páginas innecesarias del build estático
  trailingSlash: false,
}

export default nextConfig