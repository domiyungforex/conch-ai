import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Without this, Next.js infers the workspace root by scanning for lockfiles up the
  // directory tree — with unrelated sibling projects (each with their own lockfile) in
  // /Users/mac, it was picking the wrong root and breaking special-file resolution
  // (e.g. "Cannot find module for page: /favicon.ico" at build time).
  outputFileTracingRoot: path.join(__dirname),
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // MetaMask SDK pulls in React Native storage — not needed in browser
        "@react-native-async-storage/async-storage": false,
        // WalletConnect pulls in pino-pretty for dev logging — not needed in browser
        "pino-pretty": false,
      };
    }
    return config;
  },
};

export default nextConfig;
