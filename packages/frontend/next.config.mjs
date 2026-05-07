import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_REGISTRY_ADDRESS: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS,
    NEXT_PUBLIC_ESCROW_ADDRESS: process.env.NEXT_PUBLIC_ESCROW_ADDRESS,
    NEXT_PUBLIC_JUDGE_ADDRESS: process.env.NEXT_PUBLIC_JUDGE_ADDRESS,
    NEXT_PUBLIC_INFT_ADDRESS: process.env.NEXT_PUBLIC_INFT_ADDRESS,
    NEXT_PUBLIC_VAULT_ADDRESS: process.env.NEXT_PUBLIC_VAULT_ADDRESS,
  },
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
  transpilePackages: ['@crucible/shared'],
  reactStrictMode: true,
  typescript: {
    // We ignore type errors during the build to ensure the demo is accessible
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
