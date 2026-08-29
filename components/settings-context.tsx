"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useSession } from "next-auth/react";
import { loadUserSettings, saveUserSettings } from "@/hooks/action";
import { providerNames } from "@/lib/providers/list";
import { defaultShortcuts } from "@/lib/shortcuts";

// ... (Keep your interface Settings and defaultSettings here) ...
export interface Settings {
  // Account settings
  autoTracking: boolean;
  anilistTrackingThreshold: number;
  nsfwMode: boolean;
  autoplay: boolean;
  notifications: boolean;

  // Preferences
  holdToBoost: boolean;
  doubleTapToSeek: boolean;
  seekDuration: number;
  skipIntro: boolean;
  skipOutro: boolean;
  skipRecap: boolean;
  prioritiseLastUsedSource: boolean;
  providerOrder: string[];
  shortcuts: Record<string, string>;

  // Appearance
  discoverSection: boolean;
  showThumbnails: boolean;
  proxyUrl: string;
  lowPerformanceMode: boolean;

  // Desktop & Connections
  discordRpc: boolean;
  anilistToken: string;
  febboxUiToken: string;


  // Homepage
  homepageLayout: string[];
  profileListOrder: string[];

  // Subtitles
  subtitleSettings: {
    backgroundOpacity: number;
    backgroundBlur: boolean;
    textSize: number;
    textStyle: "default" | "raised" | "border" | "depressed" | "drop-shadow";
    boldText: boolean;
    color: string;
    verticalPosition: "default" | "high";
    fontFamily: string;
    outlineWidth: number;
  };
}

export const defaultSettings: Settings = {
  autoTracking: true,
  anilistTrackingThreshold: 85,
  nsfwMode: true,
  autoplay: true,
  notifications: true,
  holdToBoost: false,
  doubleTapToSeek: true,
  seekDuration: 10,
  skipIntro: true,
  skipOutro: true,
  skipRecap: true,
  prioritiseLastUsedSource: true,
  providerOrder: providerNames,
  shortcuts: defaultShortcuts,
  discoverSection: true,
  showThumbnails: true,
  proxyUrl: process.env.NEXT_PUBLIC_PROXY_URL || "http://127.0.0.1:39282",
  lowPerformanceMode: false,
  discordRpc: true,
  anilistToken: "",
  febboxUiToken: "",
  homepageLayout: [

    "watched",
    "schedule",
    "trending",
    "popular",
    "season",
    "top",
  ],
  profileListOrder: [
    "Watching",
    "Planning",
    "Completed",
    "Dropped",
    "Paused",
    "Repeating",
  ],

  subtitleSettings: {
    backgroundOpacity: 0,
    backgroundBlur: false,
    textSize: 130,
    textStyle: "border",
    boldText: true,
    color: "#FFFFFF",
    verticalPosition: "default",
    fontFamily: "Rubik",
    outlineWidth: 2,
  },
};

const STORAGE_KEY = "app-settings";

interface SettingsContextType {
  settings: Settings;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  save: () => Promise<void>;
  reset: () => void;
  hasUnsavedChanges: boolean;
  isLoading: boolean;
  saving: boolean;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

// Helper to merge data safely
function mergeSettings(loaded: Partial<Settings> | null): Settings {
  let initial = { ...defaultSettings, ...(loaded || {}) };

  // Deep merge shortcuts
  initial.shortcuts = { ...defaultShortcuts, ...(initial.shortcuts || {}) };

  // Sync providers
  const activeProviders = (initial.providerOrder || []).filter((p) =>
    providerNames.includes(p),
  );
  const newProviders = providerNames.filter(
    (p) => !(initial.providerOrder || []).includes(p),
  );

  if (
    newProviders.length > 0 ||
    activeProviders.length !== (initial.providerOrder || []).length
  ) {
    initial.providerOrder = [...activeProviders, ...newProviders];
  }

  return initial;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  // Initialize state lazily from localStorage if available (Instant load)
  const [settings, setSettings] = useState<Settings>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return mergeSettings(JSON.parse(stored));
      } catch (e) {
        /* ignore */
      }
    }
    return defaultSettings;
  });

  const [savedSettings, setSavedSettings] = useState<Settings>(settings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load from DB when session is ready
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) setIsLoading(false);
    }, 1500);

    async function syncWithServer() {
      if (status === "loading") return;

      if (status === "authenticated" && session?.user?.name) {
        try {
          // Fetch DB settings
          const dbSettings = await loadUserSettings(session.user.name);

          if (dbSettings && mounted) {
            const merged = mergeSettings(dbSettings);
            setSettings(merged);
            setSavedSettings(merged);
            // Update local storage to match DB for next reload speed
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          }
        } catch (error) {
          console.error("Failed to sync settings:", error);
        }
      }
      // If unauthenticated, we already loaded from localStorage in useState, so we are good.

      if (mounted) setIsLoading(false);
    }

    syncWithServer();

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [status, session]);


  // Track unsaved changes
  useEffect(() => {
    setHasUnsavedChanges(
      JSON.stringify(settings) !== JSON.stringify(savedSettings),
    );
  }, [settings, savedSettings]);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        return next;
      });
    },
    [],
  );

  const save = useCallback(async () => {
    setSaving(true);
    // Optimistically update "Saved" state
    setSavedSettings(settings);
    setHasUnsavedChanges(false);

    // Always save to LocalStorage first (backup cache)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));

    if (status === "authenticated" && session?.user?.name) {
      try {
        await saveUserSettings(session.user.name, settings);
      } catch (error) {
        console.error("Failed to save to DB:", error);
        // Revert state if DB fails (optional, but good practice)
        // setHasUnsavedChanges(true);
      }
    }
    setSaving(false);
  }, [settings, status, session]);

  const reset = useCallback(() => {
    setSettings(savedSettings);
    setHasUnsavedChanges(false);
  }, [savedSettings]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSetting,
        save,
        reset,
        hasUnsavedChanges,
        isLoading,
        saving,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
