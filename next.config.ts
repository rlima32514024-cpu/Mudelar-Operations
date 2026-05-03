import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions enabled by default in Next.js 14+
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hqqalymvwadfmpvavwiy.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Strict mode for better error detection
  reactStrictMode: true,
}

export default nextConfig
