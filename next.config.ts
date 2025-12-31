import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Garante que /api/webhook e /api/webhook/ sejam tratados da mesma forma
  // Isso evita o erro de "Temporary Redirect" que vimos no seu teste de curl
  trailingSlash: false,

  // Opcional: Se você usa imagens externas (como avatares do Google/GitHub)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

export default nextConfig;
