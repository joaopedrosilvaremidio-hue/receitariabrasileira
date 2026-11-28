import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Receitaria",
    short_name: "Receitaria",
    description: "Receitas simples e passo a passo.",
    start_url: "/",
    display: "standalone",
    background_color: "#fff0d8",
    theme_color: "#fff0d8",
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
