import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Sora, Lexend, DM_Mono } from "next/font/google";
import { AuthProvider } from "@/contexts/AuthContext";
import { NavProvider } from "@/contexts/NavContext";
import TopNav from "@/components/TopNav";
import BottomTabBar from "@/components/BottomTabBar";
import AuthGuard from "@/components/AuthGuard";
import FocusSessionGuard from "@/components/FocusSessionGuard";
import ThemeSync from "@/components/ThemeSync";
import PageBackground from "@/components/PageBackground";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

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
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh" suppressHydrationWarning className={`h-full ${sora.variable} ${lexend.variable} ${dmMono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="antialiased min-h-full">
        <ThemeSync />
        <PageBackground />
        <AuthProvider>
          <AuthGuard>
            <NavProvider>
              <FocusSessionGuard />
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
