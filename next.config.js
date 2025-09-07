/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client', 'prisma'],
  images: {
    domains: ['lh3.googleusercontent.com'], // For Google profile images
  },
  // Enable audio file uploads
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    return config;
  },
  // For Amplify hosting
  output: 'standalone',
}

module.exports = nextConfig
