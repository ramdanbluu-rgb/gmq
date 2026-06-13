import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.cache = {
      type: "filesystem",
      cacheDirectory: resolve(__dirname, ".next/cache"),
      compression: "gzip",
      hashAlgorithm: "md4",
      name: `${isServer ? "server" : "client"}`,
    };

    return config;
  },
};

export default nextConfig;


