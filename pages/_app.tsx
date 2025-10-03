import "../styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import { NextIntlClientProvider } from "next-intl";
import { useRouter } from "next/router";
import AppLayout from "../components/AppLayout";
import { AppProvider } from "../lib/AppContext";
import { Inter } from "next/font/google";

// Load Inter to ensure a consistent typeface across onboarding and the app
const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export default function App({ Component, pageProps }: AppProps) {
  const { locale, defaultLocale, pathname } = useRouter();

  const isAuthRoute = pathname.startsWith("/auth");
  const isWorkspaceRoute = pathname.startsWith("/workspace");
  const isRootRoute = pathname === "/";

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
