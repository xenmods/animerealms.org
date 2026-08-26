"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { signIn, useSession } from "next-auth/react";

interface Props {
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export function Login({ onNext, onPrev, onSkip }: Props) {
  const t = useTranslations("Onboarding");
  const tLogin = useTranslations("LoginPage");
  const tShared = useTranslations("Shared");
  const { data: session } = useSession();

  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 space-y-8 text-center">
      <div className="flex justify-center">
        <div className="flex items-center gap-2 px-4 py-2 rounded-full border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90">
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center">
            <img
              src="/traced-logo.png"
              alt={tLogin("logo")}
              className="h-5 w-5"
            />
          </div>
          <span className="text-sm font-semibold">
            {tLogin("realmsXAnilist")}
          </span>
        </div>
      </div>

      <div className="space-y-3 text-center sm:max-w-3/4">
        <h1 className="text-3xl font-bold text-card-foreground">
          {tLogin("title")}
        </h1>
        <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
          {tLogin("description")}
        </p>
      </div>

      <Button
        variant="outline"
        onClick={() => signIn("anilist")}
        disabled={!!session?.user}
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
        {session?.user
          ? tLogin("loggedIn", { name: session.user.name })
          : tLogin("button")}
      </Button>
      <div className="w-full flex flex-row items-center justify-center gap-2">
        <Button variant="secondary" onClick={onPrev}>
          {tShared("back")}
        </Button>
        <Button variant="outline" onClick={onNext}>
          {session?.user ? t("continue") : t("continueAsGuest")}
        </Button>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        {tLogin("footer")}
      </p>
    </div>
  );
}
