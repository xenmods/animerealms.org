import { defineRouting } from "next-intl/routing";
import { LANGUAGES } from "@/lib/consts";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: Object.keys(LANGUAGES),

  defaultLocale: "en",
});
