import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos', // Existing
      },
      {
        protocol: 'https',
        hostname: 'lockme.my', // Existing
      },
      { // Add this block for Firebase Storage
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com', // Common hostname for Firebase Storage
      }
    ],
  },
};

export default nextConfig;