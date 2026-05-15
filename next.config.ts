import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
