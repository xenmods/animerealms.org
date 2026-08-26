"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if user has already dismissed the prompt
    const isDismissed = localStorage.getItem("pwa-prompt-dismissed");
    if (isDismissed) return;

    // Detect iOS
    const isIosDevice =
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIosDevice);

    // For iOS, simple check if not in standalone mode
    if (isIosDevice) {
      const isStandalone = window.matchMedia(
        "(display-mode: standalone)"
      ).matches;
      if (!isStandalone) {
        setShowPrompt(true);
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem("pwa-prompt-dismissed", "true");
  };

  if (!mounted || !showPrompt) return null;

  // Use a very high z-index and ensure it's attached to document.body
  return createPortal(
    <div
      className="fixed bottom-4 right-4 z-[2147483647] w-full max-w-sm p-4 animate-in slide-in-from-bottom-5 fade-in duration-300"
      style={{
        position: "fixed",
        bottom: "1rem",
        right: "1rem",
        zIndex: 2147483647,
      }}
    >
      <div className="bg-background/95 backdrop-blur-md border rounded-xl shadow-lg p-4 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex gap-3">
            <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Download className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold leading-none tracking-tight">
                Install App
              </h3>
              <p className="text-sm text-muted-foreground">
                Install for a better experience
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground rounded-full p-1 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="text-sm text-muted-foreground bg-muted/50 p-2 rounded-md">
            Tap <Share className="inline h-4 w-4 mx-1" /> and select "Add to
            Home Screen"
          </div>
        ) : (
          <button
            onClick={handleInstallClick}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-full"
          >
            Install
          </button>
        )}
      </div>
    </div>,
    document.body
  );
}
