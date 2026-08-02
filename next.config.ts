import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Izinkan akses dari jaringan lokal saat development
  allowedDevOrigins: ["192.168.1.9"],
  // Wajib untuk deploy ke Prisma Compute
  output: "standalone",
}

export default nextConfig
