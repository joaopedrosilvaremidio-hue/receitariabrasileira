import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Receitaria | Aprenda a cozinhar",
  description: "Receitas simples e passo a passo para quem está começando na cozinha.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}</body></html>;
}
