import type { Metadata, Viewport } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

import { PullToRefresh } from "@/components/PullToRefresh";
import { SplashScreen } from "@/components/SplashScreen";
import { PushSubscriber } from "@/components/PushSubscriber";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "Wingspann",
  description: "Family adventures, perfectly planned. Plan trips, invite family, and build your itinerary together.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Wingspann",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable}`}>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Wingspann" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen font-sans bg-white">
       
        <SplashScreen />
        <PullToRefresh />
        <Header />
        <PushSubscriber />
        <main className="mx-auto max-w-5xl px-4 pb-8 pt-[calc(env(safe-area-inset-top,0px)+5rem)] sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
