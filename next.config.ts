import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/competicao/:competitionId/time/:teamId", destination: "/time/:teamId", permanent: true },
      { source: "/competicao/:competitionId", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
