import path from 'node:path'
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  turbopack: {
    root: path.resolve(__dirname),
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/.playwright-mcp/**',
          '**/.codex-work/**',
          '**/.dogma-evidence/**',
          '**/.superpowers/**',
          '**/docs/**',
          '**/remotion/**',
        ],
      }
    }
    return config
  },
}

export default nextConfig
