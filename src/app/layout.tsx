import type { Metadata } from "next";
import { Outfit, Playfair_Display } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";
import { PushSubscriber } from "@/components/PushSubscriber";
import { PullToRefresh } from "@/components/PullToRefresh";
import Script from "next/script";
import { SplashScreen } from "@/components/SplashScreen";

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
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Wingspann" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="min-h-screen font-sans bg-white">
        <Script
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          defer
          strategy="afterInteractive"
        />
        <Script id="onesignal-init" strategy="afterInteractive">{`
          window.OneSignalDeferred = window.OneSignalDeferred || [];
          OneSignalDeferred.push(async function(OneSignal) {
            await OneSignal.init({
              appId: "68f645ed-1d8f-4e5c-97bb-1548062edcd8",
              safari_web_id: "web.onesignal.auto.18427476-d96c-4d38-9e88-40d33a9d693d",
              notifyButton: {
                enable: true,
              },
              welcomeNotification: {
                title: "Wingspann",
                message: "Thanks for subscribing! We'll notify you about trip updates.",
              },
            });
          });
        `}</Script>
        <SplashScreen />
        <PullToRefresh />
        <Header />
        <PushSubscriber />
        <main className="mx-auto max-w-5xl px-4 pt-20 pb-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
