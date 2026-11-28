import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/admin",
    name: "Receitaria — Painel administrativo",
    short_name: "Receitaria Admin",
    description: "Painel administrativo da Receitaria.",
    start_url: "/admin",
    scope: "/",
    display: "standalone",
    background_color: "#0a0a0a",
    theme_color: "#dc2626",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any"
      }
    ]
  };
}
