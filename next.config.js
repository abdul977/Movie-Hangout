// @ts-check

/**
 * @type {import("next").NextConfig}
 **/
const nextConfig = {
  env: {
    SITE_NAME: process.env.SITE_NAME,
    PUBLIC_DOMAIN: process.env.PUBLIC_DOMAIN,
    REDIS_URL: process.env.REDIS_URL,
    DEFAULT_SRC: process.env.DEFAULT_SRC,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // apply headers to all routes
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig
