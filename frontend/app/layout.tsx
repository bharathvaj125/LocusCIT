import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LOCUS // CIT Campus Logistics & Scheduling Command Matrix",
  description: "Enterprise campus scheduling, multi-role venue orchestration, and Week 7 conflict resolution engine for Chilika Institute of Technology.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#080A0C] text-[#F3F4F6]">
        {children}
      </body>
    </html>
  );
}
