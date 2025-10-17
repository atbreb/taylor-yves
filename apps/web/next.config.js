/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },
  transpilePackages: [],
  images: {
    domains: [],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has TypeScript type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: false,
  },
}

module.exports = nextConfig