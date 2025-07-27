import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export', // tells Next.js to use static export
  trailingSlash: true,
};

export default nextConfig;
