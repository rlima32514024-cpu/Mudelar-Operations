import type { NextConfig } from 'next'

let supabaseHostname = 'hqqalymvwadfmpvavwiy.supabase.co'
try {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (url) supabaseHostname = new URL(url).hostname
} catch {
  // fall back to hardcoded value
}

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHostname,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
}

export default nextConfig
