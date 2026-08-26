"use client";

import Navbar from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { useTranslations } from "next-intl";

export default function NotFound() {
  const t = useTranslations("404");
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="flex-none p-6 relative z-50">
        <Navbar />
      </div>

      {/* Huge 404 Watermark */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-0 pointer-events-none select-none">
        <h1 className="text-[20rem] md:text-[30rem] lg:text-[40rem] font-black text-foreground/5 leading-none tracking-tighter mix-blend-overlay">
          404
        </h1>
      </div>

      <div className="container relative z-10 flex flex-col md:flex-row items-center justify-center min-h-[calc(100vh-100px)] mx-auto px-4 md:px-8">
        {/* Text Content */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-6 pt-10 md:pt-0 pb-32 md:pb-0">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              {t("title")}
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-md">
              It seems you've wandered into an unknown realm.
            </p>
          </div>

          <Link href="/">
            <Button
              size="lg"
              className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-primary/25 transition-all"
            >
              <Icon icon="solar:arrow-left-bold" className="mr-2 text-xl" />
              {t("button")}
            </Button>
          </Link>
        </div>

        {/* Anime Girl Image */}
        <div className="absolute bottom-0 right-0 md:relative md:flex-1 flex items-end justify-center md:justify-end w-full md:w-auto h-[50vh] md:h-[80vh] pointer-events-none z-20">
          <div className="relative w-full h-full max-w-[500px] md:max-w-none">
            <Image
              src="/lost-girl.png"
              alt="Confused Anime Girl"
              fill
              className="object-contain object-bottom"
              priority
              quality={100}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
