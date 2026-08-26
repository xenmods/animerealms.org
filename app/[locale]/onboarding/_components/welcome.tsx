"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

interface Props {
  onNext: () => void;
  onSkip: () => void;
}

export function Welcome({ onNext, onSkip }: Props) {
  const t = useTranslations("Onboarding");
  const tShared = useTranslations("Shared");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center gap-6 text-center"
    >
      {/* Logo */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4 }}
      >
        {/* <Image
          src="/traced-logo.png"
          alt="Logo"
          width={100}
          height={1 - 0}
          className="rounded-lg shadow-md"
        /> */}
        <DotLottieReact className="w-full" src="/rio.lottie" loop autoplay />
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="space-y-1"
      >
        <h1 className="text-3xl font-bold text-foreground">{t("welcome")}</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {t("description")}
        </p>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="flex flex-col w-full gap-2 pt-2"
      >
        <Button onClick={onNext} size="lg" className="w-full font-semibold">
          {t("getStarted")}
        </Button>
        <Button variant="outline" onClick={onSkip} size="lg" className="w-full">
          {tShared("skip")}
        </Button>
      </motion.div>
    </motion.div>
  );
}
