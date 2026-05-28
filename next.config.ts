import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Couvre firebasestorage.googleapis.com et tout domaine HTTPS.
        // Attention : Next.js proxifie les images via /_next/image — vecteur SSRF si
        // le serveur a accès à un réseau interne. Acceptable ici (Vercel, pas de réseau interne).
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
