"use client";

import { useTheme } from "next-themes";
import { useEffect } from "react";
import {
  Bricolage_Grotesque,
  Jost,
  Inter,
  Outfit,
  Plus_Jakarta_Sans,
  Open_Sans,
  Geist_Mono,
  Antic,
  Oxanium,
  Quicksand,
  Orbitron,
  Roboto,
} from "next/font/google";

const BricolageGrotesqueFont = Bricolage_Grotesque({
  variable: "--font-bricolage-grotesque",
  subsets: ["latin"],
});

const JostFont = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
});

const InterFont = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const OutfitFont = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const PlusJakartaSansFont = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
});

const OpenSansFont = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
});

const GeistMonoFont = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const AnticFont = Antic({
  variable: "--font-antic",
  weight: ["400"],
  subsets: ["latin"],
});

const OxaniumFont = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
});

const QuicksandFont = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400"],
});

const OrbitronFont = Orbitron({
  variable: "--font-orbitron",
  subsets: ["latin"],
  weight: ["400"],
});

const RobotoFont = Roboto({
  variable: "--font-roboto",
  subsets: ["latin"],
});

const fontMap = {
  dark: BricolageGrotesqueFont,
  supa: OutfitFont,
  night: InterFont,
  darkmatter: GeistMonoFont,
  netflix: InterFont,
  twit: BricolageGrotesqueFont,
  sage: AnticFont,
  doom: OxaniumFont,
  rose: QuicksandFont,
  tangerine: BricolageGrotesqueFont,
  snow: QuicksandFont,
  glitch: OrbitronFont,
  google: RobotoFont,
};

const allFontClassNames = [
  BricolageGrotesqueFont.className,
  JostFont.className,
  InterFont.className,
  OutfitFont.className,
  PlusJakartaSansFont.className,
  OpenSansFont.className,
  GeistMonoFont.className,
  AnticFont.className,
  OxaniumFont.className,
  QuicksandFont.className,
  OrbitronFont.className,
  RobotoFont.className,
];

export function ThemeFontManager() {
  const { theme } = useTheme();

  useEffect(() => {
    if (theme) {
      document.body.classList.remove(...allFontClassNames);
      const font = fontMap[theme] || BricolageGrotesqueFont;
      document.body.classList.add(font.className);
    }
  }, [theme]);

  return null;
}
