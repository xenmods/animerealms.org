"use client";

import React from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { useNetworkStatus } from "@/components/desktop/offline-banner";

interface OfflineGuardProps {
  children: React.ReactNode;
  pageTitle?: string;
}

export function OfflineGuard({ children, pageTitle = "this section" }: OfflineGuardProps) {
  const isOnline = useNetworkStatus();

  if (isOnline) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-[70vh] flex items-center justify-center p-4">
      {/* Blurred background content */}
      <div className="opacity-25 pointer-events-none select-none blur-sm w-full absolute inset-0 overflow-hidden">
        {children}
      </div>

      {/* Offline Overlay Card */}
      <div className="relative z-20 max-w-md w-full p-6 sm:p-8 bg-card/95 backdrop-blur-xl border border-border/80 rounded-3xl shadow-2xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
        <div className="mx-auto w-14 h-14 rounded-2xl bg-red-500/10 text-red-500 flex items-center justify-center border border-red-500/20 shadow-inner">
          <Icon icon="solar:cloud-cross-bold" className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">
            Offline Mode Active
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Internet connection is required to load {pageTitle}. You can still watch all your downloaded episodes offline!
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/downloads" className="w-full sm:w-auto">
            <Button className="w-full rounded-2xl h-11 px-6 bg-primary text-primary-foreground font-semibold gap-2 shadow-md hover:bg-primary/90">
              <Icon icon="solar:download-minimalistic-bold" className="w-5 h-5" />
              <span>Go to Downloads</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
