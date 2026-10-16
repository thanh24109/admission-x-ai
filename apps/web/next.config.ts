import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load shared .env from project root
const rootEnvPath = path.resolve(__dirname, "../../.env");
const rootEnvVars: Record<string, string> = {};

if (fs.existsSync(rootEnvPath)) {
  const content = fs.readFileSync(rootEnvPath, "utf-8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      rootEnvVars[key] = val;
      if (process.env[key] === undefined) {
        process.env[key] = val;
      }
    }
  }
}

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname, "../../"),
  env: {
    NEXT_PUBLIC_ENABLE_MOCK_AUTH:
      process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH ??
      rootEnvVars.NEXT_PUBLIC_ENABLE_MOCK_AUTH ??
      "false",
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ??
      rootEnvVars.NEXT_PUBLIC_API_URL ??
      "http://localhost:8000",
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "console.epu.edu.vn",
      },
      {
        protocol: "https",
        hostname: "epu.edu.vn",
      },
    ],
  },
};

export default nextConfig;
