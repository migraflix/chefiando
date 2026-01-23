/** @type {import('next').NextConfig} */
const nextConfig = {
  // API: aumentar límites para subir archivos grandes
  api: {
    bodyParser: {
      sizeLimit: '15mb', // Límite de 15MB por imagen (margen sobre 12MB)
    },
  },

  // TypeScript: validar errores en build para detectar problemas temprano
  typescript: {
    ignoreBuildErrors: false,
  },

  // Imágenes: configuración correcta para Vercel
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        pathname: '**',
      },
    ],
    unoptimized: false, // Habilitar optimización en producción
  },

  // Optimizaciones adicionales
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },

  // ⚠️ REMOVIDO: Ya no usamos lucide-react, solo @radix-ui/react-icons
  modularizeImports: {
    '@radix-ui/react-icons': {
      transform: '@radix-ui/react-icons/{{member}}',
    },
  },

  // Configuración correcta para Vercel
  trailingSlash: false,
}

export default nextConfig