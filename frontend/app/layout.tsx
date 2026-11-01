import type { Metadata, Viewport } from "next";
import { Fraunces, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", axes: ["opsz"], display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap" });

export const metadata: Metadata = {
  title: "Locus | CIT scheduling",
  description:
    "Timetables, exams and venue bookings for the Chilika Institute of Technology: generated, validated and explained.",
};

export const viewport: Viewport = { themeColor: "#0A1020", width: "device-width", initialScale: 1 };

// Sets the colour theme before the first paint, so a dark page never flashes white.
const THEME_SCRIPT = `try{var c=localStorage.getItem("locus_theme");var d=c==="dark"||((c!=="light")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.setAttribute("data-theme",d?"dark":"light")}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fraunces.variable} ${manrope.variable} ${jetbrains.variable}`}>
      <head><script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} /></head>
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
