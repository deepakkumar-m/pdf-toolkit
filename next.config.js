/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf2pic'],
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    config.resolve.alias.encoding = false;
    return config;
  },
};

module.exports = nextConfig;