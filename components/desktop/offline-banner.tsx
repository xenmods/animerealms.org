"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { processOfflineSyncQueue } from "@/lib/sync-queue";

interface NetworkState {
  isOnline: boolean;
  isAnilistDown: boolean;
}

// Global network check cache & subscribers to prevent redundant parallel probes
let currentNetworkState: NetworkState = { isOnline: true, isAnilistDown: false };
let listeners: Array<(state: NetworkState) => void> = [];

async function probeNetwork(): Promise<NetworkState> {
  if (typeof window === "undefined") return { isOnline: true, isAnilistDown: false };

  // If browser explicitly reports offline
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    return { isOnline: false, isAnilistDown: false };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: `query { Media(id: 1) { id } }` }),
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return { isOnline: true, isAnilistDown: Boolean(data.errors) };
    } else {
      // Received HTTP response from AniList, so internet is working
      return { isOnline: true, isAnilistDown: true };
    }
  } catch (err: any) {
    // If AniList request failed, test fallback connection to distinguish between offline vs AniList outage
    try {
      const pingController = new AbortController();
      const pingTimeout = setTimeout(() => pingController.abort(), 2000);
      await fetch("https://1.1.1.1/cdn-cgi/trace", {
        mode: "no-cors",
        signal: pingController.signal,
        cache: "no-store",
      });
      clearTimeout(pingTimeout);
      // General ping succeeded -> AniList is down, but user is online
      return { isOnline: true, isAnilistDown: true };
    } catch {
      // General ping failed -> User is completely offline
      return { isOnline: false, isAnilistDown: false };
    }
  }
}

export function useNetworkStatus() {
  const [state, setState] = useState<NetworkState>(currentNetworkState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);

  return state.isOnline;
}

export function useFullNetworkState() {
  const [state, setState] = useState<NetworkState>(currentNetworkState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      listeners = listeners.filter((l) => l !== setState);
    };
  }, []);

  return state;
}

export function OfflineBanner() {
  const [state, setState] = useState<NetworkState>(currentNetworkState);
  const [showReconnected, setShowReconnected] = useState(false);
  const wasOfflineRef = useRef(false);
  const reconnectedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const runCheck = useCallback(async () => {
    const nextState = await probeNetwork();
    const prevOnline = currentNetworkState.isOnline;
    currentNetworkState = nextState;
    listeners.forEach((l) => l(nextState));
    setState(nextState);

    // If transitioned from offline to online
    if (!prevOnline && nextState.isOnline) {
      setShowReconnected(true);
      processOfflineSyncQueue();

      if (reconnectedTimerRef.current) clearTimeout(reconnectedTimerRef.current);
      reconnectedTimerRef.current = setTimeout(() => {
        setShowReconnected(false);
      }, 3500);
    } else if (!nextState.isOnline) {
      wasOfflineRef.current = true;
      setShowReconnected(false);
    }
  }, []);

  useEffect(() => {
    runCheck();

    // Periodic check every 6 seconds
    const interval = setInterval(runCheck, 6000);

    const handleWindowOnline = () => {
      runCheck();
    };

    const handleWindowOffline = () => {
      const offlineState = { isOnline: false, isAnilistDown: false };
      currentNetworkState = offlineState;
      listeners.forEach((l) => l(offlineState));
      setState(offlineState);
      setShowReconnected(false);
    };

    window.addEventListener("online", handleWindowOnline);
    window.addEventListener("offline", handleWindowOffline);
    window.addEventListener("focus", runCheck);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleWindowOnline);
      window.removeEventListener("offline", handleWindowOffline);
      window.removeEventListener("focus", runCheck);
      if (reconnectedTimerRef.current) clearTimeout(reconnectedTimerRef.current);
    };
  }, [runCheck]);

  if (state.isOnline && !state.isAnilistDown && !showReconnected) {
    return null;
  }

  if (showReconnected) {
    return (
      <div className="w-full bg-emerald-600 text-white py-1.5 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 z-[100] relative rounded-b-xl shadow-md animate-in fade-in slide-in-from-top duration-300">
        <Icon icon="solar:check-circle-bold" className="w-4 h-4" />
        <span>Back online! Connected to network. Syncing data...</span>
      </div>
    );
  }

  if (!state.isOnline) {
    return (
      <div className="w-full bg-destructive text-destructive-foreground py-1.5 px-4 text-center text-sm font-medium flex items-center justify-between z-[100] relative rounded-b-xl shadow-md animate-in fade-in slide-in-from-top duration-300">
        <div className="flex items-center gap-2 mx-auto sm:mx-0">
          <Icon icon="solar:cloud-cross-bold" className="w-4 h-4" />
          <span>You are currently offline. Offline mode is active.</span>
        </div>
        <Link
          href="/downloads"
          className="hidden sm:flex items-center gap-1 font-semibold underline hover:opacity-80 transition-opacity ml-4 shrink-0"
        >
          <Icon icon="solar:download-minimalistic-bold" className="w-4 h-4" />
          <span>Go to Downloads</span>
        </Link>
      </div>
    );
  }

  if (state.isAnilistDown) {
    return (
      <div className="w-full bg-destructive text-destructive-foreground py-1.5 px-4 text-center text-sm font-medium flex items-center justify-center gap-2 z-[100] relative rounded-b-xl shadow-md">
        <Icon icon="solar:danger-triangle-bold" className="w-4 h-4" />
        <span>AniList API is currently experiencing issues. Some features and data might be unavailable.</span>
      </div>
    );
  }

  return null;
}
