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
import { DesktopHeader } from "@/components/desktop/desktop-header";
import { DesktopContextMenu } from "@/components/desktop/desktop-context-menu";
import { DiscordPresenceManager } from "@/components/desktop/discord-presence-manager";
import { OfflineBanner } from "@/components/desktop/offline-banner";




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
    <html lang="en" suppressHydrationWarning>
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
      <body className="antialiased select-none">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          themes={Object.keys(THEMES)}
        >
          <ThemeFontManager />
          <DesktopHeader />
          <NextIntlClientProvider>
            <SessionProvider refetchOnWindowFocus={false}>
              <SettingsProvider>
                <MotionProvider>
                  <ThemeTransitionProvider>
                    <ReducedMotionWrapper>
                      <div className="desktop-content-area min-h-screen">
                        <OfflineBanner />
                        {children}
                      </div>

                      <UpdateDialog />
                      <SnowParticles />
                      <LiquidSVG />
                      <CommandMenu />
                      <DesktopContextMenu />
                      <DiscordPresenceManager />
                    </ReducedMotionWrapper>


                  </ThemeTransitionProvider>
                </MotionProvider>
              </SettingsProvider>
            </SessionProvider>
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}


