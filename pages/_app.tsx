import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { NextIntlClientProvider } from "next-intl";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import AppLayout from "../components/AppLayout";
import { AppProvider } from "../lib/AppContext";
import { Inter } from "next/font/google";

// Load Inter to ensure a consistent typeface across onboarding and the app
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function App({ Component, pageProps }: AppProps) {
  const { locale, defaultLocale, pathname } = useRouter();
  const router = useRouter();
  const [routeLoading, setRouteLoading] = useState(false);

  const isAuthRoute = pathname.startsWith("/auth");
  const isWorkspaceRoute = pathname.startsWith("/workspace");
  const isRootRoute = pathname === "/";

  // Simple global top loader tied to route changes
  useEffect(() => {
    const handleStart = () => setRouteLoading(true);
    const handleDone = () => setRouteLoading(false);
    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleDone);
    router.events.on("routeChangeError", handleDone);
    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleDone);
      router.events.off("routeChangeError", handleDone);
    };
  }, [router.events]);

  return (
    <>
      <NextIntlClientProvider
        locale={locale || defaultLocale || "en"}
        timeZone="Europe/Paris"
        messages={pageProps.messages || {}}
      >
        <AppProvider>
          <Head>
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1"
            />
          </Head>
          {/* Global top loader */}
          {routeLoading && (
            <div className="fixed top-0 left-0 right-0 z-[9999] h-1 overflow-hidden">
              <div className="h-full w-1/3 bg-gradient-to-r from-fuchsia-500 via-rose-500 to-pink-500 animate-toploader" />
            </div>
          )}
          <div className={`fixed inset-0 -z-10 ${inter.className}`}>
            <div className="absolute inset-0 bg-white" />
            {/* <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" /> */}
          </div>
          {isAuthRoute || isWorkspaceRoute || isRootRoute ? (
            <div className={`relative min-h-screen ${inter.className}`}>
              <Component {...pageProps} />
            </div>
          ) : (
            <AppLayout
              locale={locale || defaultLocale || "en"}
              messages={pageProps.messages || {}}
            >
              <Component {...pageProps} />
            </AppLayout>
          )}
        </AppProvider>
      </NextIntlClientProvider>
    </>
  );
}
