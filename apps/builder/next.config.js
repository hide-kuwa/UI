/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // packages/core を相対importするために必要
    externalDir: true
  },
};
export default nextConfig;
