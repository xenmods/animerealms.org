"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LANGUAGES } from "@/lib/consts";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useTransition } from "react";

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export function Language({ onNext, onPrev }: Props) {
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("Onboarding");
  const tShared = useTranslations("Shared");

  const onSelectChange = (newLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
      router.refresh();
    });
  };

  return (
    <div className="flex h-full w-full flex-col items-center justify-center pb-8 text-center">
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="mb-8"
      >
        <h1 className="text-4xl font-bold">{t("language")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("languageDescription")}
        </p>
      </motion.div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-3/4">
        {Object.entries(LANGUAGES).map(([key, label]) => (
          <div
            key={key}
            onClick={() => onSelectChange(key)}
            className={`cursor-pointer flex flex-col items-start border-2 rounded-lg p-4 ${
              locale === key
                ? "bg-accent/30"
                : "border-primary/10 hover:bg-accent/20"
            }`}
          >
            <span className="uppercase">{key}</span>
            <span className="text-muted-foreground">{label}</span>
          </div>
        ))}
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
