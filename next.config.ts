import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Las respuestas de la API dependen del espacio de trabajo de cada usuario: nunca deben cachearse.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "Vary", value: "Cookie, x-workspace-id" },
        ],
      },
    ];
  },
};

export default nextConfig;
