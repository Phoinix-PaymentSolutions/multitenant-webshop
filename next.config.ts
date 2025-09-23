import type { NextConfig } from "next";
import { i18n } from "./next-i18next.config";


module.exports = {
  i18n,
  experimental: {
    appDir: true,
  },
};


const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
