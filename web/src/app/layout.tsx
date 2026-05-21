import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "COG Workforce Intelligence",
  description:
    "Workforce Intelligence for Multi-Site Operations — Caldwell Operations Group",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className={`${inter.className} h-full flex`}>
        <Sidebar />
        <main className="flex-1 overflow-auto bg-zinc-50 pt-14 md:pt-0">{children}</main>
      </body>
    </html>
  );
}
