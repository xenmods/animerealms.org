import type { Metadata } from "next";
import { Architects_Daughter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider } from "next-intl";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "@/components/ui/sonner";
import { THEMES } from "@/lib/consts";
import { ThemeFontManager } from "@/components/theme-font-manager";
import { GoogleAnalytics } from "@next/third-parties/google";

import "@/app/globals.css";
import { MotionProvider } from "@/components/motion-provider";
import { ReducedMotionWrapper } from "@/components/reduced-motion-wrapper";
import UpdateDialog from "@/components/shared/update-dialog";
import { SettingsProvider } from "@/components/settings-context";

import { SnowParticles } from "@/components/snow-particles";
import { LiquidSVG } from "@/components/shared/liquid-svg";
import { ThemeTransitionProvider } from "@/components/shared/theme-transition";
import { CommandMenu } from "@/components/shared/command-menu";
import { DonationButton } from "@/components/shared/donation-button";

export const metadata: Metadata = {
  title: "Anime Realms",
  description: "Watch your favorite anime for free with no ads ever! (っ'ヮ'c)",
  openGraph: {
    title: "Anime Realms",
    description:
      "Watch your favorite anime for free with no ads ever! (っ'ヮ'c)",
  },
  metadataBase: new URL("https://animerealms.org"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, interactive-widget=resizes-content"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta
          name="apple-mobile-web-app-status-bar-style"
          content="black-translucent"
        ></meta>
        <meta name="darkreader-lock" />
      </head>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        themes={Object.keys(THEMES)}
      >
        <ThemeFontManager />
        <body className="antialiased select-none">
          <NextIntlClientProvider>
            <SessionProvider refetchOnWindowFocus={false}>
              <SettingsProvider>
                <MotionProvider>
                  <ThemeTransitionProvider>
                    <ReducedMotionWrapper>
                      {children}
                      <UpdateDialog />
                      <SnowParticles />
                      <LiquidSVG />
                      <CommandMenu />
                    </ReducedMotionWrapper>
                  </ThemeTransitionProvider>
                  <DonationButton />
                </MotionProvider>
              </SettingsProvider>
            </SessionProvider>
            <Toaster />
          </NextIntlClientProvider>
        </body>
        <GoogleAnalytics gaId="G-HP0KRY884Y" />
      </ThemeProvider>
    </html>
  );
}
