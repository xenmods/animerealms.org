"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import * as Sortable from "@/components/ui/sortable";
import {
  User,
  SettingsIcon,
  Palette,
  Subtitles,
  Link2,
  Loader2,
  List,
  GripVertical,
} from "lucide-react";
import { useSettings } from "@/components/settings-context";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Navbar from "@/components/shared/navbar";
import { useSession, signIn, signOut } from "next-auth/react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "@/i18n/navigation";
import { ImportSettingsDialog } from "@/components/settings/import-dialog";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { providerNames, providersConfig } from "@/lib/providers/list";
import { Badge } from "@/components/ui/badge";
import { THEMES } from "@/lib/consts";
import { ShortcutDialog } from "@/components/settings/shortcut-dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Icon } from "@iconify/react";
import { useThemeTransition } from "@/components/shared/theme-transition";

import {
  SettingInput,
  SettingItem,
  ThemePreview,
  SettingSliderItem,
} from "@/components/settings/setting-helpers";
import { SubtitleSettings } from "@/components/settings/subtitle-settings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteAccount } from "@/components/shared/action";

type SettingsSection =
  | "account"
  | "preferences"
  | "appearance"
  | "homepage"
  | "profile"
  | "providers"
  | "subtitles"
  | "connections";

const ALL_HOMEPAGE_SECTIONS = [
  "watched",
  "schedule",
  "trending",
  "popular",
  "season",
  "top",
  "PLANNING",
  "COMPLETED",
  "DROPPED",
  "PAUSED",
  "REPEATING",
  "CURRENT",
];

const getSections = (t: (key: string) => string) => [
  {
    id: "account" as const,
    label: t("account_section"),
    icon: "solar:user-bold",
  },
  {
    id: "preferences" as const,
    label: t("preferences_section"),
    icon: "solar:settings-bold",
  },
  {
    id: "appearance" as const,
    label: t("appearance_section"),
    icon: "solar:paint-roller-bold",
  },
  {
    id: "homepage" as const,
    label: t("homepage_section"),
    icon: "solar:home-bold",
  },
  {
    id: "profile" as const,
    label: t("profile_section"),
    icon: "solar:user-id-bold",
  },
  {
    id: "providers" as const,
    label: t("providers_section"),
    icon: "solar:box-bold",
  },
  {
    id: "subtitles" as const,
    label: t("subtitles_section"),
    icon: "solar:subtitles-bold",
  },
  {
    id: "connections" as const,
    label: t("connections_section"),
    icon: "solar:link-round-angle-bold",
  },
];

export default function SettingsPage() {
  const t = useTranslations("Settings");
  const tShared = useTranslations("Shared");
  const { data: session } = useSession();
  const sections = getSections(t).filter(
    (s) => s.id !== "profile" || !!session?.user,
  );
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [shortcutDialogOpen, setShortcutDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const {
    settings,
    updateSetting,
    save,
    saving,
    reset,
    hasUnsavedChanges,
    isLoading,
  } = useSettings();

  const { theme: currentTheme } = useTheme();
  const { changeTheme: setTheme } = useThemeTransition();
  const router = useRouter();
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showFinalDeleteAlert, setShowFinalDeleteAlert] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      // clear localstorage
      localStorage.clear();
      await deleteAccount();
      await signOut();
    } catch (error) {
      console.error("Failed to delete account", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const [activeSection, setActiveSection] = useState<SettingsSection>(
    sections[0].id,
  );
  const mainContentRef = useRef<HTMLElement>(null);

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    const mainEl = mainContentRef.current;

    if (isLoading || !mainEl) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            const isValidSection = sections.some(
              (s) => s.id === entry.target.id,
            );
            if (isValidSection) {
              setActiveSection(entry.target.id as SettingsSection);
            }
          }
        });
      },
      {
        root: mainEl,
        threshold: 0.5,
      },
    );

    const sectionElements = mainEl.querySelectorAll("section[id]");
    sectionElements.forEach((el) => observer.observe(el));

    return () => {
      sectionElements.forEach((el) => observer.unobserve(el));
      observer.disconnect();
    };
  }, [isLoading, sections]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleExportSettings = () => {
    const settingsString = JSON.stringify(settings, null, 2);
    const blob = new Blob([settingsString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "settings.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportSettings = (newSettings: any) => {
    Object.entries(newSettings).forEach(([key, value]) => {
      if (key in settings) {
        updateSetting(key as any, value);
      }
    });
  };

  return (
    <div className="before:border-border after:border-border relative z-10 min-h-[80vh] snap-start before:absolute before:top-0 before:left-0 before:h-full before:w-5 before:border-r before:bg-[linear-gradient(-135deg,_var(--color-border)_25%,_transparent_25%,_transparent_50%,_var(--color-border)_50%,_var(--color-border)_75%,_transparent_75%,_transparent)] before:bg-[length:5px_5px] after:absolute after:top-0 after:right-0 after:h-full after:w-5 after:border-l after:bg-[linear-gradient(135deg,_var(--color-border)_25%,_transparent_25%,_transparent_50%,_var(--color-border)_50%,_var(--color-border)_75%,_transparent_75%,_transparent)] after:bg-[length:5px_5px] max-md:before:hidden max-md:after:hidden md:px-8 flex flex-col items-center gap-8 overflow-hidden">
      {/* Navbar */}
      <div className="absolute top-0 left-0 right-0 z-50 md:left-8 md:right-8">
        <Navbar />
      </div>

      {/* Import Dialog */}
      <ImportSettingsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        onImport={handleImportSettings}
      />
      <ShortcutDialog
        settings={settings}
        updateSetting={updateSetting}
        open={shortcutDialogOpen}
        onOpenChange={setShortcutDialogOpen}
      />

      {/* fixed fullscreen overlay if loading then show loader */}
      {isLoading ? (
        <div className="inset-0 w-screen h-screen bg-background/70 flex flex-col items-center justify-center z-50 gap-3">
          <Loader2 className="animate-spin w-7 h-7" />
          <p className="text-sm text-muted-foreground">Fetching Settings...</p>
        </div>
      ) : (
        <>
          {/* fixed right a vertical nav which shows small divs showing progress */}
          <div className="fixed top-1/2 -translate-y-1/2 right-2 lg:hidden flex flex-col gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={cn(
                  "w-1 rounded-full transition-all duration-300 ease-in-out",
                  activeSection === section.id
                    ? "h-7 bg-primary" // Active state
                    : "h-3 bg-muted-foreground/50 hover:bg-muted-foreground", // Inactive state
                )}
                aria-label={`Go to ${section.label} section`}
              />
            ))}
          </div>

          <div className="h-screen w-full flex pt-20 px-4 md:px-0">
            {/* Sidebar - Hidden on mobile since users can just scroll */}
            <aside className="w-64 border-r border-border pb-6 px-6 flex flex-col gap-8 max-lg:hidden fixed left-8 top-20 bottom-0 overflow-y-auto">
              <div>
                <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-3">
                  Settings
                </h2>
                <nav className="space-y-1">
                  {sections.map((section) => {
                    return (
                      <button
                        key={section.id}
                        onClick={() => scrollToSection(section.id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                          activeSection === section.id
                            ? "bg-accent text-accent-foreground" // Active state
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground", // Inactive state
                        )}
                      >
                        <Icon icon={section.icon} className="size-4" />
                        {t(`${section.id}_section`)}
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="mt-auto px-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {t("app_stats")}
                </h3>
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Hostname</div>
                    <div className="font-mono text-foreground">
                      {typeof window !== "undefined" &&
                        window.location.hostname}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground flex items-center gap-1">
                      Backend URL
                      <span className="text-green-500">●</span>
                    </div>
                    <div className="font-mono text-foreground">
                      Private (secure)
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">User ID</div>
                    <div className="font-mono text-foreground text-[10px]">
                      {session?.user?.id || "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content - Now shows all sections at once for scrolling */}
            <main
              ref={mainContentRef}
              className="flex-1 overflow-y-auto snap-y snap-mandatory max-lg:ml-0 lg:ml-64 h-full no-scrollbar w-full"
            >
              <div className="space-y-0">
                {/* Account Section */}
                <section
                  id="account"
                  className="min-h-[80vh] snap-start flex justify-center px-4 py-8"
                >
                  <div className="max-w-5xl w-full">
                    <h2 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
                      {t("account_section")}
                    </h2>
                    {session?.user ? (
                      <div>
                        <div className="w-full bg-card/60 flex flex-col sm:flex-row sm:items-center gap-4 justify-between rounded-xl p-8">
                          {/* Avatar + Name Section */}
                          <div className="flex items-center">
                            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 bg-muted">
                              <AvatarImage
                                src={
                                  session.user.image.large || "/placeholder.svg"
                                }
                                alt={session.user.name}
                              />
                              <AvatarFallback>
                                {session.user.name?.slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="ml-4">
                              <p className="text-muted-foreground text-sm sm:text-base">
                                {t("synced")}
                              </p>
                              <h3 className="text-lg sm:text-2xl font-semibold">
                                {session.user.name}
                              </h3>
                            </div>
                          </div>

                          {/* Button Section */}
                          <div className="flex justify-end w-full sm:w-auto gap-2 items-center">
                            <Button
                              variant="outline"
                              onClick={() => {
                                window.open(
                                  "https://anilist.co/settings/",
                                  "_blank",
                                );
                              }}
                            >
                              {tShared("edit")}
                            </Button>
                            <Button
                              variant={"destructive"}
                              onClick={() => signOut()}
                            >
                              {tShared("signOut")}
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
                          {/* Import/Export Card - Updated to use dialog */}
                          <div className="w-full h-full bg-card/60 flex flex-col gap-2 justify-between rounded-xl p-8 col-span-2">
                            <div className="flex flex-col gap-1">
                              <h2 className="font-semibold text-lg">
                                {t("import_export")}
                              </h2>
                              <p className="text-muted-foreground text-sm">
                                {t("import_export_description")}
                              </p>
                            </div>{" "}
                            <div className="flex flex-col items-center justify-center gap-1 w-full">
                              <Button
                                className="w-full"
                                onClick={() => setImportDialogOpen(true)}
                              >
                                {t("import")}
                              </Button>
                              <Button
                                className="w-full"
                                variant="secondary"
                                onClick={handleExportSettings}
                              >
                                {t("export")}
                              </Button>
                            </div>
                          </div>

                          {/* Delete Card */}
                          <div className="w-full h-full bg-card/60 flex flex-col gap-4 justify-between rounded-xl p-8">
                            <div className="flex flex-col gap-1">
                              <h2 className="font-semibold text-lg">
                                {t("delete_account")}
                              </h2>
                              <p className="text-muted-foreground text-sm">
                                {t("delete_account_description")}
                              </p>
                            </div>{" "}
                            <Button
                              variant="destructive"
                              onClick={() => setShowDeleteAlert(true)}
                            >
                              {tShared("delete")}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full bg-card/60 flex flex-col sm:flex-row items-center justify-between rounded-xl p-6 sm:p-8">
                        <div className="w-full sm:w-3/4 text-center sm:text-left">
                          <h3 className="text-xl font-semibold">
                            {t("cloud_prompt")}
                          </h3>
                          <p className="text-muted-foreground text-sm sm:text-base">
                            {t("cloud_description")}
                          </p>
                        </div>
                        <div className="mt-4 sm:mt-0">
                          <Button onClick={() => router.push("/login")}>
                            {tShared("signIn")}
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Preferences Section */}
                <section
                  id="preferences"
                  className="min-h-[80vh] snap-start flex justify-center px-4 py-12"
                >
                  <div className="max-w-5xl w-full">
                    <h2 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
                      {t("preferences_section")}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 sm:gap-x-12 w-full">
                      <SettingItem
                        title={t("nsfwMode")}
                        description={t("nsfwModeDescription")}
                        checked={settings.nsfwMode}
                        onCheckedChange={(checked) =>
                          updateSetting("nsfwMode", checked)
                        }
                      />
                      <SettingItem
                        title={t("doubleTapToSeek")}
                        description={t("doubleTapToSeekDescription")}
                        checked={settings.doubleTapToSeek}
                        onCheckedChange={(checked) =>
                          updateSetting("doubleTapToSeek", checked)
                        }
                      />
                      <AnimatePresence>
                        {settings.doubleTapToSeek && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{
                              duration: 0.3,
                              ease: "easeInOut",
                            }}
                            className="overflow-hidden"
                          >
                            <SettingSliderItem
                              title={t("seekDuration")}
                              description={t("seekDurationDescription")}
                              value={settings.seekDuration}
                              onValueChange={(value) =>
                                updateSetting("seekDuration", value[0])
                              }
                              min={5}
                              max={30}
                              step={1}
                              unit="s"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <SettingItem
                        title={t("skipIntro")}
                        description={t("skipIntroDescription")}
                        checked={settings.skipIntro}
                        onCheckedChange={(checked) =>
                          updateSetting("skipIntro", checked)
                        }
                      />
                      <SettingItem
                        title={t("skipOutro")}
                        description={t("skipOutroDescription")}
                        checked={settings.skipOutro}
                        onCheckedChange={(checked) =>
                          updateSetting("skipOutro", checked)
                        }
                      />
                      <SettingItem
                        title={t("skipRecap")}
                        description={t("skipRecapDescription")}
                        checked={settings.skipRecap}
                        onCheckedChange={(checked) =>
                          updateSetting("skipRecap", checked)
                        }
                      />
                      <SettingItem
                        title={t("prioritiseLastUsedSource")}
                        description={t("prioritiseLastUsedSourceDescription")}
                        checked={settings.prioritiseLastUsedSource}
                        onCheckedChange={(checked) =>
                          updateSetting("prioritiseLastUsedSource", checked)
                        }
                      />
                      <SettingItem
                        title={t("autoTracking")}
                        description={t("autoTrackingDescription")}
                        checked={settings.autoTracking}
                        onCheckedChange={(checked) =>
                          updateSetting("autoTracking", checked)
                        }
                      />
                      <AnimatePresence>
                        {settings.autoTracking && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="overflow-hidden col-span-1 sm:col-span-2"
                          >
                            <SettingSliderItem
                              title={t("anilistTrackingThreshold")}
                              description={t(
                                "anilistTrackingThresholdDescription",
                              )}
                              value={settings.anilistTrackingThreshold}
                              onValueChange={(value) =>
                                updateSetting(
                                  "anilistTrackingThreshold",
                                  value[0],
                                )
                              }
                              min={50}
                              max={95}
                              step={1}
                              unit="%"
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="mt-8 border-t border-border pt-8">
                      <h3 className="text-lg font-medium text-foreground mb-2">
                        {t("playerShortcuts")}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {t("playerShortcutsDescription")}
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => setShortcutDialogOpen(true)}
                      >
                        {t("customizeShortcuts")}
                      </Button>
                    </div>
                  </div>
                </section>

                {/* Appearance Section */}
                <section
                  id="appearance"
                  className="min-h-[80vh] snap-start flex justify-center px-4 py-12"
                >
                  <div className="max-w-5xl w-full">
                    <h2 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
                      {t("appearance_section")}
                    </h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="">
                        <SettingItem
                          title={t("discoverSection")}
                          description={t("discoverSectionDescription")}
                          checked={settings.discoverSection}
                          onCheckedChange={(checked) =>
                            updateSetting("discoverSection", checked)
                          }
                        />{" "}
                        <SettingItem
                          title={t("showThumbnails")}
                          description={t("showThumbnailsDescription")}
                          checked={settings.showThumbnails}
                          onCheckedChange={(checked) =>
                            updateSetting("showThumbnails", checked)
                          }
                        />
                        <SettingItem
                          title={t("lowPerformanceMode")}
                          description={t("lowPerformanceModeDescription")}
                          checked={settings.lowPerformanceMode}
                          onCheckedChange={(checked) =>
                            updateSetting("lowPerformanceMode", checked)
                          }
                        />
                      </div>
                      <div className="space-y-4">
                        <div className="h-[450px] overflow-y-auto pr-2 no-scrollbar">
                          <div className="grid grid-cols-2 gap-2">
                            {Object.keys(THEMES).map((themeName) => (
                              <ThemePreview
                                key={themeName}
                                theme={themeName}
                                currentTheme={currentTheme}
                                setTheme={setTheme}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Homepage Section */}
                <section
                  id="homepage"
                  className="min-h-[80vh] snap-start flex justify-center px-4 py-12"
                >
                  <div className="max-w-5xl w-full">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-4xl sm:text-6xl font-bold text-foreground">
                        {t("homepage_section")}
                      </h2>
                      <Button
                        variant="outline"
                        onClick={() =>
                          updateSetting("homepageLayout", [
                            "watched",
                            "schedule",
                            "trending",
                            "popular",
                            "season",
                            "top",
                          ])
                        }
                      >
                        Reset
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">
                          {t("active_sections")}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t("active_sections_desc")}
                        </p>
                        <Sortable.Root
                          value={settings.homepageLayout || []}
                          onValueChange={(newOrder) => {
                            updateSetting("homepageLayout", newOrder);
                          }}
                          orientation="vertical"
                        >
                          <Sortable.Content className="space-y-2">
                            {(settings.homepageLayout || []).map((section) => (
                              <Sortable.Item
                                key={section}
                                value={section}
                                className="bg-card p-4 rounded-lg flex items-center justify-between"
                              >
                                <div className="flex items-center gap-4">
                                  <Sortable.ItemHandle>
                                    <GripVertical className="text-muted-foreground" />
                                  </Sortable.ItemHandle>
                                  <span className="font-medium">
                                    {tShared(section.toLowerCase()) || section}
                                  </span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    const newLayout = (
                                      settings.homepageLayout || []
                                    ).filter((s) => s !== section);
                                    updateSetting("homepageLayout", newLayout);
                                  }}
                                >
                                  <Icon icon="solar:trash-bin-trash-bold" />
                                </Button>
                              </Sortable.Item>
                            ))}
                          </Sortable.Content>
                          <Sortable.Overlay />
                        </Sortable.Root>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">
                          {t("available_sections")}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t("available_sections_desc")}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {ALL_HOMEPAGE_SECTIONS.filter(
                            (s) =>
                              !(settings.homepageLayout || []).includes(s) &&
                              (session?.user ||
                                [
                                  "watched",
                                  "schedule",
                                  "trending",
                                  "popular",
                                  "season",
                                  "top",
                                ].includes(s)),
                          ).map((section) => (
                            <Button
                              key={section}
                              variant="secondary"
                              className="justify-start gap-2"
                              onClick={() => {
                                updateSetting("homepageLayout", [
                                  ...(settings.homepageLayout || []),
                                  section,
                                ]);
                              }}
                            >
                              <Icon icon="solar:add-circle-bold" />
                              {tShared(section.toLowerCase()) || section}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Profile Section */}
                {session?.user && (
                  <section
                    id="profile"
                    className="min-h-[80vh] snap-start flex justify-center px-4 py-12"
                  >
                    <div className="max-w-5xl w-full">
                      <div className="flex items-center justify-between mb-6">
                        <h2 className="text-4xl sm:text-6xl font-bold text-foreground">
                          {t("profile_section")}
                        </h2>
                        <Button
                          variant="outline"
                          onClick={() =>
                            updateSetting("profileListOrder", [
                              "Watching",
                              "Planning",
                              "Completed",
                              "Dropped",
                              "Paused",
                              "Repeating",
                            ])
                          }
                        >
                          Reset
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <h3 className="text-xl font-semibold">
                          {t("profile_list_order")}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {t("profile_list_order_desc")}
                        </p>
                        <Sortable.Root
                          value={settings.profileListOrder || []}
                          onValueChange={(newOrder) => {
                            updateSetting("profileListOrder", newOrder);
                          }}
                          orientation="vertical"
                        >
                          <Sortable.Content className="space-y-2">
                            {(settings.profileListOrder || []).map((list) => (
                              <Sortable.Item
                                key={list}
                                value={list}
                                className="bg-card p-4 rounded-lg flex items-center justify-between"
                              >
                                <div className="flex items-center gap-4">
                                  <Sortable.ItemHandle>
                                    <GripVertical className="text-muted-foreground" />
                                  </Sortable.ItemHandle>
                                  <span className="font-medium">
                                    {tShared(list.toLowerCase()) || list}
                                  </span>
                                </div>
                              </Sortable.Item>
                            ))}
                          </Sortable.Content>
                          <Sortable.Overlay />
                        </Sortable.Root>
                      </div>
                    </div>
                  </section>
                )}

                {/* Providers Section */}
                <section
                  id="providers"
                  className="min-h-[80vh] snap-start flex justify-center px-4 py-12"
                >
                  <div className="max-w-5xl w-full">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-4xl sm:text-6xl font-bold text-foreground">
                        {t("providers_section")}
                      </h2>
                      <Button
                        variant="outline"
                        onClick={() =>
                          updateSetting("providerOrder", providerNames)
                        }
                      >
                        Reset
                      </Button>
                    </div>
                    <div
                      className="text-muted-foreground text-sm mb-4"
                      id="providers"
                    >
                      {t("provider_description")}
                    </div>
                    <Sortable.Root
                      value={settings.providerOrder || []}
                      onValueChange={(newOrder) => {
                        updateSetting("providerOrder", newOrder);
                      }}
                      orientation="vertical"
                    >
                      <Sortable.Content className="space-y-2 h-[450px] overflow-y-auto no-scrollbar py-2">
                        {(settings.providerOrder || []).map((provider) => (
                          <Sortable.Item
                            key={provider}
                            value={provider}
                            className="bg-card p-4 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <Sortable.ItemHandle>
                                <GripVertical className="text-muted-foreground" />
                              </Sortable.ItemHandle>
                              <span className="font-medium">
                                {providersConfig[provider]?.name || provider}
                              </span>
                            </div>
                            {providersConfig[provider]?.name.includes(
                              "Dub",
                            ) && <Badge variant="outline">Dub</Badge>}
                          </Sortable.Item>
                        ))}
                      </Sortable.Content>
                      <Sortable.Overlay />
                    </Sortable.Root>
                  </div>
                </section>

                {/* Subtitles Section */}
                <section
                  id="subtitles"
                  className="min-h-[80vh] snap-start flex justify-center px-4 py-12"
                >
                  <div className="max-w-5xl w-full">
                    <h2 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
                      {t("subtitles_section")}
                    </h2>
                    <SubtitleSettings />
                  </div>
                </section>

                {/* Connections Section */}
                <section
                  id="connections"
                  className="min-h-[80vh] snap-start flex justify-center px-4 py-12"
                >
                  <div className="max-w-5xl w-full">
                    <h2 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
                      {t("connections_section")}
                    </h2>
                    <SettingInput
                      title={t("customProxy")}
                      description={t("customProxyDescription")}
                      value={settings.proxyUrl}
                      onChange={(e) =>
                        updateSetting("proxyUrl", e.target.value)
                      }
                      placeholder={t("customProxyPlaceholder")}
                    />

                    <div className="flex flex-col gap-2 pt-4 border-t border-border mt-4">
                      <SettingInput
                        title="FebBox UI Token"
                        description="Required for streaming from FebBox."
                        value={settings.febboxUiToken}
                        type="password"
                        onChange={(e) =>
                          updateSetting("febboxUiToken", e.target.value)
                        }
                        placeholder="Paste 'ui' cookie value here"
                      />
                      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm text-yellow-500">
                        <p className="font-semibold mb-1">
                          How to get this token:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 opacity-90">
                          <li>
                            Log in to{" "}
                            <a
                              href="https://www.febbox.com"
                              target="_blank"
                              className="underline hover:text-yellow-400"
                            >
                              FebBox.com
                            </a>
                          </li>
                          <li>
                            Open Developer Tools (F12) → Application → Cookies
                          </li>
                          <li>
                            Copy the value of the Cookie named <code>ui</code>
                          </li>
                        </ol>
                        <p className="mt-2 font-bold bg-yellow-500/20 p-2 rounded">
                          ⚠️ IMPORTANT: Do NOT log out of FebBox, or this token
                          will expire immediately.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </main>

            {/* Unsaved Changes Banner */}
            <AnimatePresence>
              {hasUnsavedChanges && (
                <motion.div
                  initial={{ y: 100, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 100, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-11/12 sm:w-auto"
                >
                  <div className="w-10 h-10">
                    <motion.svg
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlnsXlink="http://www.w3.org/1999/xlink"
                      x="0px"
                      y="0px"
                      viewBox="0 0 43.1 85.9"
                      style={{ enableBackground: "new 0 0 43.1 85.9" }}
                      xmlSpace="preserve"
                      className="w-full h-full"
                      initial="hidden"
                      animate="visible" // Triggers the "visible" variant on mount
                    >
                      {/* Main Arrow Body */}
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="fill-none stroke-white stroke-[5]"
                        d="M11.3,2.5c-5.8,5-8.7,12.7-9,20.3s2,15.1,5.3,22c6.7,14,18,25.8,31.7,33.1"
                        variants={{
                          hidden: {
                            opacity: 0,
                            pathLength: 0, // Start as "undrawn"
                          },
                          visible: {
                            opacity: 1,
                            pathLength: 1, // Animate to "fully drawn"
                            transition: {
                              duration: 1,
                              ease: "easeInOut",
                            },
                          },
                        }}
                      />
                      {/* Arrow Tail Part 1 */}
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="fill-none stroke-white stroke-[5]"
                        d="M40.6,78.1C39,71.3,37.2,64.6,35.2,58"
                        variants={{
                          hidden: { opacity: 0 },
                          visible: {
                            opacity: 1,
                            transition: {
                              delay: 1, // Start fading in after the main path is nearly done
                              duration: 0.5,
                              repeat: Number.POSITIVE_INFINITY,
                              repeatType: "restart",
                              repeatDelay: 1, // Wait 1s before looping
                            },
                          },
                        }}
                      />
                      {/* Arrow Tail Part 2 */}
                      <motion.path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="fill-none stroke-white stroke-[5]"
                        d="M39.8,78.5c-7.2,1.7-14.3,3.3-21.5,4.9"
                        variants={{
                          hidden: { opacity: 0 },
                          visible: {
                            opacity: 1,
                            transition: {
                              delay: 1.2, // Start fading in after the main path is nearly done
                              duration: 0.5,
                            },
                          },
                        }}
                      />
                    </motion.svg>
                  </div>

                  <div className="bg-card border border-border rounded-lg shadow-2xl px-6 py-4 flex items-center gap-4">
                    <p className="text-sm font-medium text-foreground">
                      {t("unsaved")}{" "}
                      <span className="text-muted-foreground">ฅ^•ﻌ•^ฅ</span>
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={reset}
                        className="hover:bg-accent bg-transparent"
                      >
                        {tShared("reset")}
                      </Button>
                      <Button
                        size="sm"
                        disabled={saving}
                        onClick={save}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 flex flex-row items-center"
                      >
                        {tShared("save")}
                        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("delete_account_warning_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_account_warning_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tShared("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                setShowDeleteAlert(false);
                setShowFinalDeleteAlert(true);
              }}
            >
              {tShared("next")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={showFinalDeleteAlert}
        onOpenChange={setShowFinalDeleteAlert}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("delete_account_final_warning_title")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("delete_account_final_warning_description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tShared("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAccount();
              }}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {tShared("delete")}
                </>
              ) : (
                tShared("delete")
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
