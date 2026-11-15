import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Caveat, Kalam, Patrick_Hand, Shadows_Into_Light_Two } from "next/font/google";
import "./globals.css";
import AppNav from "@/components/AppNav";
import Mascot from "@/components/Mascot";

const caveat = Caveat({
  subsets: ["latin"],
  variable: "--font-caveat",
  weight: ["400", "500", "600", "700"],
});

const kalam = Kalam({
  subsets: ["latin"],
  variable: "--font-kalam",
  weight: ["300", "400", "700"],
});

const patrick = Patrick_Hand({
  subsets: ["latin"],
  variable: "--font-patrick",
  weight: "400",
});

const shadows = Shadows_Into_Light_Two({
  subsets: ["latin"],
  variable: "--font-shadows",
  weight: "400",
});

export const metadata: Metadata = {
  title: "Oposita · Apuntes, tests y juegos para tus oposiciones",
  description:
    "Sube las leyes de tu oposición y genera apuntes completos, tests con estadísticas y juegos de repaso. Con Oposita, la mascota que te acompaña mientras estudias.",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect x='10' y='6' width='44' height='52' rx='4' fill='%23fffdf4' stroke='%23b45309' stroke-width='3'/%3E%3Cpath d='M20 6v52' stroke='%23f87171' stroke-width='2'/%3E%3Cpath d='M26 20h22M26 30h22M26 40h16' stroke='%2393c5fd' stroke-width='3' stroke-linecap='round'/%3E%3C/svg%3E",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="es"
      className={`${caveat.variable} ${kalam.variable} ${patrick.variable} ${shadows.variable}`}
    >
      <body className="min-h-screen text-stone-800 antialiased">
        <AppNav />
        {children}
        <Mascot />
      </body>
    </html>
  );
}
