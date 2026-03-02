import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NavProvider } from "@/contexts/NavContext";
import TopNav from "@/components/TopNav";
import BottomTabBar from "@/components/BottomTabBar";

export const metadata: Metadata = {
  title: "Level Up",
  description: "个人成长数据中枢 — 专注、记录、反思",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#faf8f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Sora:wght@300..800&family=Lexend:wght@300..700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-full">
        <NavProvider>
          <TopNav />
          <BottomTabBar />

          {/* Page content */}
          <div className="page-content">
            {children}
          </div>
        </NavProvider>
      </body>
    </html>
  );
}
