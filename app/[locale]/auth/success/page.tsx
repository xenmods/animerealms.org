"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";

export default function AuthSuccessPage() {
  const { data: session } = useSession();
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/auth/desktop-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: session.user }),
      }).then(() => setSynced(true));
    }
  }, [session]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background text-foreground select-none">
      <Card className="w-full max-w-md p-8 bg-card border-border shadow-2xl rounded-2xl text-center space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center animate-pulse">
              <Icon icon="solar:check-circle-bold" className="w-10 h-10 text-emerald-500" />
            </div>
            <Icon icon="solar:stars-minimalistic-bold" className="w-6 h-6 text-amber-400 absolute -top-1 -right-1 animate-bounce" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Authentication Successful!
          </h1>
          <p className="text-sm text-muted-foreground">
            {session?.user?.name ? (
              <>
                Signed in as <span className="font-semibold text-primary">{session.user.name}</span>
              </>
            ) : (
              "Connected with your AniList account."
            )}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-muted/50 border border-border/50 text-xs text-muted-foreground space-y-1 text-left">
          <div className="flex items-center gap-2 text-foreground font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
            <span>Desktop App Synchronized</span>
          </div>
          <p className="pl-4 text-[11px] text-muted-foreground/80">
            You can now return to the AnimeRealms desktop app to start watching.
          </p>
        </div>

        <Button
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90"
          onClick={() => {
            if (typeof window !== "undefined") {
              window.close();
            }
          }}
        >
          <Icon icon="solar:close-square-linear" className="w-4 h-4 mr-2" />
          Close This Tab
        </Button>
      </Card>
    </div>
  );
}