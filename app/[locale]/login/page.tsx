"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/shared/navbar";
import { useSession, signIn } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { isTauri, openInBrowser } from "@/lib/tauri";
import { Icon } from "@iconify/react";
import { toast } from "sonner";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const tShared = useTranslations("Shared");
  const t = useTranslations("LoginPage");
  const router = useRouter();
  const [waitingAuth, setWaitingAuth] = useState(false);

  const handleSignIn = async () => {
    if (isTauri()) {
      setWaitingAuth(true);
      await openInBrowser("http://localhost:3000/api/auth/desktop-signin");
    } else {
      signIn("anilist");
    }
  };

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status]);

  useEffect(() => {
    if (!waitingAuth) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/auth/desktop-sync");
        const data = await res.json();
        if (data.authenticated) {
          setWaitingAuth(false);
          toast.success(`Welcome back, ${data.user?.name || "User"}!`);
          if (data.token) {
            window.location.href = `/api/auth/desktop-apply-session?token=${encodeURIComponent(data.token)}`;
          } else {
            window.location.href = "/";
          }
        }
      } catch (e) {
        // ignore polling error
      }
    }, 1200);

    return () => clearInterval(interval);
  }, [waitingAuth]);


  return (
    <div className="before:border-border after:border-border relative z-10 min-h-[80vh] snap-start before:absolute before:top-0 before:left-0 before:h-full before:w-5 before:border-r before:bg-[linear-gradient(-135deg,_var(--color-border)_25%,_transparent_25%,_transparent_50%,_var(--color-border)_50%,_var(--color-border)_75%,_transparent_75%,_transparent)] before:bg-[length:5px_5px] after:absolute after:top-0 after:right-0 after:h-full after:w-5 after:border-l after:bg-[linear-gradient(135deg,_var(--color-border)_25%,_transparent_25%,_transparent_50%,_var(--color-border)_50%,_var(--color-border)_75%,_transparent_75%,_transparent)] after:bg-[length:5px_5px] max-md:before:hidden max-md:after:hidden md:px-8 flex flex-col items-center gap-8 overflow-hidden">
      {/* Navbar */}
      <div className="absolute top-0 left-0 right-0 z-50 md:left-8 md:right-8">
        <Navbar />
      </div>
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full min-w-[50vw] bg-card border-border shadow-xl">
          <div className="p-8 space-y-8 flex flex-col items-center">
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90">
                <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
                  <img
                    src="/traced-logo.png"
                    alt={t("logo")}
                    className="h-5 w-5"
                  />
                </div>
                <span className="text-sm font-semibold">
                  {t("realmsXAnilist")}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-center sm:max-w-3/4">
              <h1 className="text-3xl font-bold text-card-foreground">
                {t("title")}
              </h1>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                {t("description")}
              </p>
            </div>

            {waitingAuth ? (
              <div className="w-full flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-muted/40 border border-primary/20 animate-pulse">
                <Icon icon="solar:restart-bold" className="w-7 h-7 animate-spin text-primary" />
                <p className="text-sm font-medium text-foreground text-center">
                  Waiting for AniList authorization in your browser...
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  Click Authorize on AniList, and the desktop app will connect automatically.
                </p>
              </div>
            ) : (

              <Button
                variant="outline"
                onClick={handleSignIn}
                className="w-full h-12"
              >
                <svg
                  className="w-6 h-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  preserveAspectRatio="xMidYMid"
                  viewBox="0 0 172 172"
                >
                  <defs>
                    <style
                      dangerouslySetInnerHTML={{
                        __html:
                          "\n      .cls-1 {\n        fill: #02a9ff;\n      }\n\n      .cls-1, .cls-2 {\n        fill-rule: evenodd;\n      }\n\n      .cls-2 {\n        fill: #fefefe;\n      }\n    ",
                      }}
                    />
                  </defs>
                  <g>
                    <path
                      d="M111.322,111.157 L111.322,41.029 C111.322,37.010 109.105,34.792 105.086,34.792 L91.365,34.792 C87.346,34.792 85.128,37.010 85.128,41.029 C85.128,41.029 85.128,56.337 85.128,74.333 C85.128,75.271 94.165,79.626 94.401,80.547 C101.286,107.449 95.897,128.980 89.370,129.985 C100.042,130.513 101.216,135.644 93.267,132.138 C94.483,117.784 99.228,117.812 112.869,131.610 C112.986,131.729 115.666,137.351 115.833,137.351 C131.170,137.351 148.050,137.351 148.050,137.351 C152.069,137.351 154.286,135.134 154.286,131.115 L154.286,117.394 C154.286,113.375 152.069,111.157 148.050,111.157 L111.322,111.157 Z"
                      className="cls-1"
                    />
                    <path
                      d="M54.365,34.792 L18.331,137.351 L46.327,137.351 L52.425,119.611 L82.915,119.611 L88.875,137.351 L116.732,137.351 L80.836,34.792 L54.365,34.792 ZM58.800,96.882 L67.531,68.470 L77.094,96.882 L58.800,96.882 Z"
                      className="cls-2"
                    />
                  </g>
                </svg>
                {t("button")}
              </Button>
            )}


            <p className="text-center text-xs text-muted-foreground">
              {t("footer")}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
