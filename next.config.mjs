/** @type {import('next').NextConfig} */
const nextConfig = {
  // Keep Prisma out of the server bundle (Next 15 stable key).
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
