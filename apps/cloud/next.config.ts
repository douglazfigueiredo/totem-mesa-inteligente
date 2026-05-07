import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@app/schemas', '@app/types'],
};

export default nextConfig;
