import type { Metadata } from "next";
import { Noto_Sans_SC, Space_Grotesk } from "next/font/google";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { SetupBanner } from "@/components/ui/setup-banner";

import "./globals.css";

const notoSans = Noto_Sans_SC({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "Match Campus",
  description: "校园里找机会、发招募、展示技能、连接导师的协作平台。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${notoSans.variable} ${spaceGrotesk.variable} antialiased`}>
        <div className="relative min-h-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-0 h-[30rem] bg-[radial-gradient(circle_at_top,_rgba(74,139,255,0.14),_transparent_56%)]" />
            <div className="absolute right-[-4rem] top-24 h-72 w-72 rounded-full bg-[rgba(255,179,102,0.1)] blur-3xl" />
            <div className="absolute left-[-2rem] top-80 h-96 w-96 rounded-full bg-[rgba(109,174,255,0.1)] blur-3xl" />
          </div>
          <SiteHeader />
          <SetupBanner />
          <main className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
            {children}
          </main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
