import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sora, Lexend, DM_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavProvider } from "@/contexts/NavContext";
import TopNav from "@/components/TopNav";
import BottomTabBar from "@/components/BottomTabBar";
import AuthGuard from "@/components/AuthGuard";

const sora = Sora({ subsets: ["latin"], variable: "--font-display" });
const lexend = Lexend({ subsets: ["latin"], variable: "--font-body" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-mono" });

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
    <html lang="zh" className={`h-full ${sora.variable} ${lexend.variable} ${dmMono.variable}`}>
      <body className="antialiased min-h-full">
        <AuthProvider>
          <AuthGuard>
            <NavProvider>
              <TopNav />
              <BottomTabBar />

              {/* Page content */}
              <div className="page-content">
                {children}
              </div>
            </NavProvider>
          </AuthGuard>
        </AuthProvider>
      </body>
    </html>
  );
}
