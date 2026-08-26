"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { THEMES } from "@/lib/consts";
import { useTheme } from "next-themes";
import { ThemePreview } from "./theme-preview";
import { useTranslations } from "next-intl";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export function Theme({ onNext, onPrev }: Props) {
  const { theme: currentTheme, setTheme } = useTheme();
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
        <h1 className="text-4xl font-bold">{t("theme")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("themeDescription")}
        </p>
      </motion.div>
      <div className="h-[450px] overflow-y-auto pr-2 no-scrollbar">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full">
          {Object.keys(THEMES).map((themeName) => (
            <ThemePreview
              key={themeName}
              theme={themeName}
              currentTheme={currentTheme}
              setTheme={setTheme}
            />
          ))}
        </div>
      </div>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-8 flex space-x-4"
      >
        <Button variant="outline" onClick={onPrev}>
          {tShared("back")}
        </Button>
        <Button onClick={onNext}>{tShared("next")}</Button>
      </motion.div>
    </div>
  );
}
