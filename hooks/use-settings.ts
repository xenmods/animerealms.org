"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { loadUserSettings, saveUserSettings } from "./action";
import { providerNames } from "@/lib/providers/list";
import { defaultShortcuts } from "@/lib/shortcuts";

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
  proxyUrl: process.env.NEXT_PUBLIC_PROXY_URL || "",
  lowPerformanceMode: false,
};

const STORAGE_KEY = "app-settings";

export function useSettings() {
  const { data: session, status } = useSession();
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [savedSettings, setSavedSettings] = useState<Settings>(defaultSettings);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);

      if (status === "loading") {
        return;
      }

      // We use Partial<Settings> here because loaded data might be missing new keys
      let loadedSettings: Partial<Settings> | null = null;

      if (status === "authenticated" && session?.user?.name) {
        try {
          const dbSettings = await loadUserSettings(session.user.name);
          loadedSettings = dbSettings;
        } catch (error) {
          console.error("Failed to load user settings from DB:", error);
        }
      } else {
        try {
          const stored = localStorage.getItem(STORAGE_KEY);
          if (stored) {
            loadedSettings = JSON.parse(stored);
          }
        } catch (error) {
          console.error("Failed to load settings from localStorage:", error);
        }
      }

      let initialSettings: Settings = {
        ...defaultSettings,
        ...(loadedSettings || {}),
      };

      const finalShortcuts = {
        ...defaultShortcuts,
        ...(initialSettings.shortcuts || {}),
      };
      initialSettings = { ...initialSettings, shortcuts: finalShortcuts };

      const allProviders = providerNames;
      const userProviders = initialSettings.providerOrder || [];

      const activeProviders = userProviders.filter((p) =>
        allProviders.includes(p)
      );

      const newProviders = allProviders.filter(
        (p) => !userProviders.includes(p)
      );

      if (
        newProviders.length > 0 ||
        activeProviders.length !== userProviders.length
      ) {
        initialSettings = {
          ...initialSettings,
          providerOrder: [...activeProviders, ...newProviders],
        };
      }

      setSettings(initialSettings);
      setSavedSettings(initialSettings);
      setIsLoading(false);
    }

    loadSettings();
  }, [status, session]);

  useEffect(() => {
    if (isLoading) return;
    const hasChanges =
      JSON.stringify(settings) !== JSON.stringify(savedSettings);
    setHasUnsavedChanges(hasChanges);
  }, [settings, savedSettings, isLoading]);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  const save = useCallback(async () => {
    if (status === "authenticated" && session?.user?.name) {
      try {
        setSaving(true);
        await saveUserSettings(session.user.name, settings);
        setSavedSettings(settings);
        setHasUnsavedChanges(false);
        setSaving(false);
      } catch (error) {
        console.error("Failed to save settings to DB:", error);
        setSaving(false);
      }
    } else {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        setSavedSettings(settings);
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error("Failed to save settings to localStorage:", error);
      }
    }
  }, [settings, status, session]);

  const reset = useCallback(() => {
    setSettings(savedSettings);
    setHasUnsavedChanges(false);
  }, [savedSettings]);

  return {
    settings,
    updateSetting,
    save,
    saving,
    reset,
    hasUnsavedChanges,
    isLoading,
  };
}
