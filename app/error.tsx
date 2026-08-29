"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";

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
        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left space-y-6 pt-10 md:pt-0 pb-32 md:pb-0 max-w-2xl">
          <div className="space-y-3 w-full">
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-foreground">
              Something went wrong!
            </h1>
            <p className="text-muted-foreground text-sm md:text-base">
              An unexpected error occurred during playback or page rendering.
            </p>

            {error?.message && (
              <div className="mt-4 p-4 rounded-xl bg-red-950/30 border border-red-800/40 text-left space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-red-400 uppercase tracking-wider">
                  <span>Error Details</span>
                  {error.digest && <span className="text-muted-foreground">ID: {error.digest}</span>}
                </div>
                <pre className="text-xs text-red-300 font-mono overflow-auto max-h-48 whitespace-pre-wrap break-words">
                  {error.message}
                  {error.stack ? `\n\n${error.stack}` : ""}
                </pre>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs h-7 border-red-800/50 hover:bg-red-900/30"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `Error: ${error.message}\nDigest: ${error.digest || "N/A"}\nStack: ${error.stack || "N/A"}`
                    );
                  }}
                >
                  <Icon icon="solar:copy-linear" className="mr-1 size-3.5" />
                  Copy Error Log
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-row gap-4 pt-2">
            <Button
              size="lg"
              onClick={reset}
              className="text-base px-6 py-5 rounded-xl shadow-lg hover:shadow-primary/25 transition-all bg-primary text-primary-foreground"
            >
              <Icon icon="solar:restart-bold" className="mr-2 text-lg" />
              Try Again
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="text-base px-6 py-5 rounded-xl border-2 hover:bg-accent transition-all"
            >
              <Link href="/">
                <Icon icon="solar:home-bold" className="mr-2 text-lg" />
                Go Home
              </Link>
            </Button>
          </div>
        </div>

        {/* Anime Girl Image */}
        <div className="absolute bottom-0 right-0 md:relative md:flex-1 flex items-end justify-center md:justify-end w-full md:w-auto h-[40vh] md:h-[70vh] pointer-events-none z-20">
          <div className="relative w-full h-full max-w-[450px] md:max-w-none">
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
