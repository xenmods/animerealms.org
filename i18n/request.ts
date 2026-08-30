import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

const messageImports: Record<string, () => Promise<any>> = {
  ar: () => import("../messages/ar.json"),
  de: () => import("../messages/de.json"),
  en: () => import("../messages/en.json"),
  es: () => import("../messages/es.json"),
  fr: () => import("../messages/fr.json"),
  hi: () => import("../messages/hi.json"),
  ja: () => import("../messages/ja.json"),
  ru: () => import("../messages/ru.json"),
  uwu: () => import("../messages/uwu.json"),
  zh: () => import("../messages/zh.json"),
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? (requested as string)
    : routing.defaultLocale;

  const loader = messageImports[locale] || messageImports.en;
  const messages = (await loader()).default;

  return {
    locale,
    messages,
  };
});

