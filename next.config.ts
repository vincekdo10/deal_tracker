import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude Snowflake SDK from client-side bundle
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        child_process: false,
        perf_hooks: false,
        'fs/promises': false,
        http2: false,
      };
    }
    return config;
  },
  serverExternalPackages: ['snowflake-sdk'],
};

export default nextConfig;
