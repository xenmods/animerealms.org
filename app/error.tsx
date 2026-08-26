"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";

import { reportError } from "@/lib/actions/error-actions";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
    reportError({
      message: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-background">
      <div className="flex-none p-6 relative z-50">
        <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
          <Image src="/traced-logo.png" alt="Logo" width={40} height={40} />
        </Link>
      </div>

      {/* Huge Error Watermark */}
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden z-0 pointer-events-none select-none">
        <h1 className="text-[15rem] md:text-[25rem] lg:text-[35rem] font-black text-foreground/5 leading-none tracking-tighter mix-blend-overlay">
          OOPS!
        </h1>
      </div>

      <div className="container relative z-10 flex flex-col md:flex-row items-center justify-center min-h-[calc(100vh-100px)] mx-auto px-4 md:px-8">
        {/* Text Content */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-6 pt-10 md:pt-0 pb-32 md:pb-0">
          <div className="space-y-2">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground">
              Something went wrong!
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-md">
              We&apos;re sorry, but an unexpected error has occurred.
              {isDev && error.message ? (
                <span className="block mt-2 text-sm text-red-400 font-mono bg-red-950/20 p-2 rounded text-left overflow-auto max-h-40">
                  DEVELOPMENT ONLY:
                  <br />
                  Error: {error.message}
                </span>
              ) : (
                <span className="block mt-2 text-sm text-muted-foreground/60">
                  Our team has been notified.
                </span>
              )}
            </p>
          </div>

          <div className="flex flex-row gap-4">
            <Button
              size="lg"
              onClick={reset}
              className="text-lg px-8 py-6 rounded-full shadow-lg hover:shadow-primary/25 transition-all bg-primary text-primary-foreground"
            >
              <Icon icon="solar:restart-bold" className="mr-2 text-xl" />
              Try Again
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-lg px-8 py-6 rounded-full border-2 hover:bg-accent transition-all"
            >
              <Link href="/">
                <Icon icon="solar:home-bold" className="mr-2 text-xl" />
                Go Home
              </Link>
            </Button>
          </div>
        </div>

        {/* Anime Girl Image */}
        <div className="absolute bottom-0 right-0 md:relative md:flex-1 flex items-end justify-center md:justify-end w-full md:w-auto h-[50vh] md:h-[80vh] pointer-events-none z-20">
          <div className="relative w-full h-full max-w-[500px] md:max-w-none">
            <Image
              src="/error-girl.png"
              alt="Apologetic Anime Girl"
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
