import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: false,
  devIndicators: false,
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
