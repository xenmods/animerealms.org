"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Icon } from "@iconify/react";
import { isTauri, startEpisodeDownload, openDownloadsFolder } from "@/lib/tauri";
import { toast } from "sonner";
import { useRouter } from "@/i18n/navigation";

interface QualityOption {
  label: string;
  url: string;
  resolution?: string;
  isDefault?: boolean;
}

interface DownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  animeDetails?: any;
  episode?: any;
  currentSrc?: string;
  streams?: any[];
  providerConfig?: any;
}

export function DownloadModal({
  isOpen,
  onClose,
  animeDetails,
  episode,
  currentSrc,
  streams = [],
  providerConfig,
}: DownloadModalProps) {
  const router = useRouter();

  // Extract qualities from streams or create default options
  const qualityOptions: QualityOption[] = React.useMemo(() => {
    const list: QualityOption[] = [];

    if (Array.isArray(streams) && streams.length > 0) {
      streams.forEach((s) => {
        if (s?.url) {
          const res = s.quality || s.resolution || "Default";
          list.push({
            label: res === "auto" ? "Auto (Adaptive)" : res,
            url: s.url,
            resolution: res,
            isDefault: s.url === currentSrc,
          });
        }
      });
    }

    if (list.length === 0 && currentSrc) {
      list.push({
        label: "1080p (Highest Available)",
        url: currentSrc,
        resolution: "1080p",
        isDefault: true,
      });
      list.push({
        label: "720p (High Definition)",
        url: currentSrc,
        resolution: "720p",
      });
      list.push({
        label: "480p (Standard)",
        url: currentSrc,
        resolution: "480p",
      });
    }

    return list;
  }, [streams, currentSrc]);

  const [selectedQuality, setSelectedQuality] = useState<string>(
    qualityOptions[0]?.resolution || "1080p"
  );
  const [selectedUrl, setSelectedUrl] = useState<string>(
    qualityOptions[0]?.url || currentSrc || ""
  );

  const animeTitle =
    animeDetails?.title?.english ||
    animeDetails?.title?.romaji ||
    animeDetails?.title?.native ||
    "Anime";
  const epNum = episode?.episode_number || episode?.number || 1;

  const handleDownload = async () => {
    onClose();

    // Store metadata for the download card
    const cover =
      animeDetails?.coverImage?.extraLarge ||
      animeDetails?.coverImage?.large ||
      animeDetails?.bannerImage ||
      "";
    const anilistId = animeDetails?.id;
    const safeTitle = animeTitle.replace(/[\/\\?%*:|"<>]/g, "").trim();
    const metaKey = `${safeTitle}_${epNum}`;

    if (typeof window !== "undefined") {
      try {
        const stored = JSON.parse(
          localStorage.getItem("animerealms_downloads_meta") || "{}"
        );
        stored[metaKey] = {
          animeTitle,
          episode: epNum,
          coverImage: cover,
          quality: selectedQuality,
          anilistId,
          downloadedAt: Date.now(),
        };
        localStorage.setItem(
          "animerealms_downloads_meta",
          JSON.stringify(stored)
        );
      } catch (e) {
        console.warn("Failed to store download metadata", e);
      }
    }

    if (isTauri()) {
      toast.info(`Download has started: Episode ${epNum}`, {
        description: `${animeTitle} • Saving to Downloads/AnimeRealms`,
        id: "dl-progress",
        action: {
          label: "View Progress",
          onClick: () => router.push("/downloads"),
        },
      });

      try {
        const targetUrl = selectedUrl || currentSrc || "";
        startEpisodeDownload({
          streamUrl: targetUrl,
          animeTitle,
          episodeNumber: epNum,
          quality: selectedQuality,
          referer: providerConfig?.ref,
        })
          .then((filePath) => {
            toast.success(`Download complete: ${animeTitle} - Ep ${epNum}`, {
              id: "dl-progress",
              action: {
                label: "View Downloads",
                onClick: () => router.push("/downloads"),
              },
            });
          })
          .catch((err) => {
            toast.error(err?.message || "Failed to download episode", {
              id: "dl-progress",
            });
          });
      } catch (err: any) {
        toast.error(err?.message || "Download initiation failed", {
          id: "dl-progress",
        });
      }
    } else {


      const safeTitle = animeTitle.replace(/[\/\\?%*:|"<>]/g, "").trim();
      const customUrl = `https://download.animerealms.org/?url=${encodeURIComponent(
        selectedUrl || currentSrc || ""
      )}&filename=${encodeURIComponent(`${safeTitle} - Episode ${epNum}`)}`;
      window.open(customUrl, "_blank");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[440px] bg-card border-border shadow-2xl rounded-2xl p-6 select-none">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Icon icon="solar:download-minimalistic-bold" className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold">
                Download Episode {epNum}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground line-clamp-1">
                {animeTitle}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-3 space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Select Quality
          </p>

          <div className="space-y-2">
            {qualityOptions.map((opt, idx) => {
              const isSelected = selectedQuality === opt.resolution;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedQuality(opt.resolution || "1080p");
                    setSelectedUrl(opt.url);
                  }}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl border text-sm transition-all cursor-pointer ${
                    isSelected
                      ? "border-primary bg-primary/10 text-foreground font-semibold shadow-xs"
                      : "border-border/60 hover:border-border hover:bg-muted/40 text-muted-foreground"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      icon={
                        isSelected
                          ? "solar:check-circle-bold"
                          : "solar:circle-linear"
                      }
                      className={`w-4 h-4 ${
                        isSelected ? "text-primary" : "text-muted-foreground/60"
                      }`}
                    />
                    <span>{opt.label}</span>
                  </div>
                  {opt.isDefault && (
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                      Current
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-muted/30 border border-border/40 text-[11px] text-muted-foreground flex items-center gap-2">
            <Icon icon="solar:folder-with-files-linear" className="w-4 h-4 text-primary shrink-0" />
            <span className="truncate">Saved to Downloads/AnimeRealms/</span>
          </div>
        </div>

        <DialogFooter className="flex flex-row items-center justify-end gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-xl h-10 px-4 text-muted-foreground hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleDownload}
            className="rounded-xl h-10 px-5 bg-primary text-primary-foreground font-medium shadow-md hover:bg-primary/90"
          >
            <Icon icon="solar:download-bold" className="w-4 h-4 mr-1.5" />
            Start Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}