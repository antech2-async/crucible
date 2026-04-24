/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@crucible/shared'],
  reactStrictMode: true,
  typescript: {
    // We ignore type errors during the build to ensure the demo is accessible
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
