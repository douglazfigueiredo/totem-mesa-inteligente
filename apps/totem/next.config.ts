import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@app/schemas', '@app/types', '@app/ui'],
  experimental: {
    typedRoutes: false,
  },
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=300' }],
      },
    ];
  },
};

export default nextConfig;
