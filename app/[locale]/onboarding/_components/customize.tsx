"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

interface Props {
  onPrev: () => void;
  onSkip: () => void;
}

const customizationOptions = [
  {
    title: "Player Settings",
    description: "Adjust playback, seeking, and skip options.",
    icon: "solar:videocamera-bold",
  },
  {
    title: "Appearance",
    description: "Change themes and UI preferences.",
    icon: "solar:palette-bold",
  },
  {
    title: "Providers",
    description: "Manage and prioritize your anime sources.",
    icon: "solar:box-bold",
  },
  {
    title: "Account Sync",
    description: "Connect with AniList for watch progress.",
    icon: "solar:user-bold",
  },
];

export function Customize({ onPrev, onSkip }: Props) {
  const t = useTranslations("Onboarding");
  const tShared = useTranslations("Shared");
  return (
    <div className="flex h-full w-full flex-col items-center justify-center pb-8 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold">{t("finish")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("finishDescription")}
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-2 gap-4 max-w-lg mb-5"
      >
        {customizationOptions.map((option, index) => (
          <div
            key={index}
            className="flex flex-col items-center p-4 border rounded-lg"
          >
            <Icon icon={option.icon} className="h-8 w-8 mb-2 text-primary" />
            <h3 className="font-semibold text-lg">{option.title}</h3>
            <p className="text-sm text-muted-foreground">
              {option.description}
            </p>
          </div>
        ))}
      </motion.div>

      <Link href="/settings" passHref className="mb-8">
        <Button onClick={onSkip} variant={"outline"}>
          {t("goToSettings")}
        </Button>
      </Link>

      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="flex space-x-4"
      >
        <Button variant="outline" onClick={onPrev}>
          {tShared("back")}
        </Button>
        <Button onClick={onSkip}>{t("startWatching")}</Button>
      </motion.div>
    </div>
  );
}
