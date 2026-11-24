/** @type {import('next').NextConfig} */
const nextConfig = {
  // Genera un servidor Node autocontenido en .next/standalone para Docker.
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  // Oculta el indicador de desarrollo de Next (el botón "N" y su menú).
  devIndicators: false,
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['172.31.240.1', '172.18.128.1'],
}

export default nextConfig
