/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prisma client is external to the server bundle.
    serverComponentsExternalPackages: ["@prisma/client", "prisma"],
  },
};

export default nextConfig;
