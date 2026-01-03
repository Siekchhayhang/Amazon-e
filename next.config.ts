import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

// Explicitly point to your request file
const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'utfs.io',
        port: '',
      },
    ],
  },
}

export default withNextIntl(nextConfig)