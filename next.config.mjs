// ===== Next.js Configuration with Sentry =====
import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['puppeteer-core', '@sparticuz/chromium'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};

const sentryConfig = {
  org: process.env.SENTRY_ORG || '',
  project: process.env.SENTRY_PROJECT || '',
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: process.env.NODE_ENV === 'production',
  disableLogger: true,
  automaticVercelMonitors: false,
};

export default process.env.SENTRY_DSN
  ? withSentryConfig(nextConfig, sentryConfig)
  : nextConfig;
