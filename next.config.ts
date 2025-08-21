import type { NextConfig } from "next";

const nextConfig: NextConfig = {
   eslint: {
    ignoreDuringBuilds: true, // <--- ignora ESLint no build
  },
};

export default nextConfig;
