/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf2pic'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: {
    outputFileTracingRoot: __dirname,
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = nextConfig;