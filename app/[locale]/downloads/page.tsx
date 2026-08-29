"use client";

import React, { useEffect, useState } from "react";
import Navbar from "@/components/shared/navbar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@iconify/react";
import { useRouter } from "@/i18n/navigation";
import {
  isTauri,
  getDownloadedFiles,
  openDownloadsFolder,
  deleteDownloadedFile,
  playDownloadedFile,
  onDownloadProgress,
  DownloadedFile,
  DownloadProgressEvent,
} from "@/lib/tauri";
import { toast } from "sonner";


interface StoredMeta {
  animeTitle?: string;
  episode?: number;
  coverImage?: string;
  quality?: string;
  anilistId?: number;
  downloadedAt?: number;
}

export default function DownloadsPage() {
  const router = useRouter();
  const [files, setFiles] = useState<DownloadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<Record<string, StoredMeta>>({});
  const [activeDownload, setActiveDownload] = useState<DownloadProgressEvent | null>(
    null
  );

  const fetchFiles = async () => {
    if (!isTauri()) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await getDownloadedFiles();
      setFiles(list);

      // Load metadata from localStorage
      const saved = localStorage.getItem("animerealms_downloads_meta");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setMetadata(parsed);
        } catch (e) {
          // ignore
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to load downloads");
    } finally {
      setLoading(false);
    }
  };

  const handleFetchOnlinePoster = async (
    animeTitle: string,
    filePath: string
  ) => {
    try {
      const query = `
        query ($search: String) {
          Media(search: $search, type: ANIME) {
            id
            coverImage { extraLarge large }
          }
        }
      `;
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, variables: { search: animeTitle } }),
      });
      const json = await res.json();
      const cover =
        json?.data?.Media?.coverImage?.extraLarge ||
        json?.data?.Media?.coverImage?.large;
      if (cover) {
        setMetadata((prev) => {
          const updated = {
            ...prev,
            [filePath]: {
              ...(prev[filePath] || {}),
              coverImage: cover,
              anilistId: json?.data?.Media?.id,
            },
          };
          localStorage.setItem(
            "animerealms_downloads_meta",
            JSON.stringify(updated)
          );
          return updated;
        });
      }
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchFiles();

    let unlisten: (() => void) | undefined;
    if (isTauri()) {
      onDownloadProgress((ev) => {
        if (ev.percent >= 100 || ev.status === "Complete") {
          setActiveDownload(null);
          fetchFiles();
        } else {
          setActiveDownload(ev);
        }
      }).then((un) => {
        unlisten = un;
      });
    }

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleDelete = async (filePath: string, filename: string) => {
    try {
      await deleteDownloadedFile(filePath);
      toast.success(`Deleted ${filename}`);
      fetchFiles();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete file");
    }
  };

  const handlePlay = (
    filePath: string,
    animeTitle: string,
    episode: number,
    coverImage?: string,
    anilistId?: number
  ) => {
    const targetId = anilistId || encodeURIComponent(animeTitle || "anime");
    const params = new URLSearchParams();
    params.set("offline", "true");
    params.set("file", filePath);
    params.set("title", animeTitle || "Anime");
    if (coverImage) params.set("cover", coverImage);
    router.push(`/watch/${targetId}/${episode}?${params.toString()}`);
  };


  return (
    <div className="min-h-screen bg-background text-foreground select-none">
      <Navbar />

      <main className="container max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                <Icon
                  icon="solar:download-minimalistic-bold"
                  className="w-6 h-6"
                />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Downloads
              </h1>
            </div>
            <p className="text-sm text-muted-foreground">
              Manage your offline anime episodes in Anime Realms.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchFiles}
              className="rounded-xl h-10 px-3 hover:bg-accent"
              title="Refresh"
            >
              <Icon icon="solar:restart-linear" className="w-4 h-4 text-muted-foreground" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={openDownloadsFolder}
              className="rounded-xl h-10 px-4 gap-2 hover:bg-accent"
            >
              <Icon icon="solar:folder-open-bold" className="w-4 h-4 text-primary" />
              <span>Open Folder</span>
            </Button>
          </div>
        </div>

        {/* Active Download Progress Card */}
        {activeDownload && (
          <Card className="p-5 bg-card/90 border-primary/40 shadow-xl rounded-2xl space-y-3 animate-pulse">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Icon icon="solar:download-bold" className="w-6 h-6 animate-bounce" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    Downloading: {activeDownload.anime_title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Episode {activeDownload.episode} &bull; {activeDownload.status}
                  </p>
                </div>
              </div>
              <span className="text-base font-mono font-bold text-primary shrink-0">
                {activeDownload.percent}%
              </span>
            </div>

            <div className="w-full h-2 bg-muted/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300 rounded-full"
                style={{ width: `${activeDownload.percent}%` }}
              />
            </div>
          </Card>
        )}

        {/* Downloaded Episodes Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Downloaded Episodes ({files.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-16 text-center text-muted-foreground space-y-2">
              <Icon
                icon="solar:restart-bold"
                className="w-6 h-6 animate-spin mx-auto text-primary"
              />
              <p className="text-xs">Scanning downloads folder...</p>
            </div>
          ) : files.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-3 rounded-2xl border border-dashed border-border/60 bg-muted/10 p-8">
              <div className="p-4 rounded-2xl bg-muted/40 text-muted-foreground/60">
                <Icon
                  icon="solar:box-minimalistic-linear"
                  className="w-10 h-10"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-foreground">
                  No downloaded episodes yet
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Episodes downloaded from the video player will appear here with cover art for offline viewing.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {files.map((file, idx) => {
                const safeTitle = file.anime_title
                  .replace(/[\/\\?%*:|"<>]/g, "")
                  .trim();
                const key = `${safeTitle}_${file.episode}`;
                const fileMeta = metadata[key] || {};
                const posterImg = fileMeta.coverImage;

                return (
                  <Card
                    key={idx}
                    className="p-4 bg-card/90 hover:bg-card border-border/60 hover:border-primary/40 transition-all rounded-2xl shadow-sm hover:shadow-lg flex flex-col sm:flex-row items-start sm:items-center gap-4 group"
                  >
                    {/* Poster Thumbnail */}
                    <div className="w-20 h-28 sm:w-22 sm:h-32 rounded-xl overflow-hidden bg-muted border border-border/50 shrink-0 relative shadow-sm group-hover:scale-102 transition-transform duration-200">
                      {posterImg ? (
                        <img
                          src={posterImg}
                          alt={file.anime_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/10 to-muted text-muted-foreground p-2 text-center">
                          <Icon icon="solar:clapperboard-play-bold" className="w-6 h-6 text-primary/70 mb-1" />
                          <span className="text-[10px] font-medium line-clamp-2">
                            {file.anime_title}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Metadata & Actions */}
                    <div className="flex-1 min-w-0 space-y-2.5 w-full">
                      <div>
                        <h4 className="text-base font-bold text-foreground truncate group-hover:text-primary transition-colors">
                          {file.anime_title}
                        </h4>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap mt-1">
                          <Badge
                            variant="default"
                            className="bg-primary/15 text-primary border-primary/30 text-[11px] font-semibold rounded-md px-2 py-0.5"
                          >
                            Episode {file.episode}
                          </Badge>
                          <span className="font-mono">{file.formatted_size}</span>
                          {fileMeta.quality && (
                            <Badge
                              variant="outline"
                              className="text-[10px] uppercase font-mono px-1.5 py-0"
                            >
                              {fileMeta.quality}
                            </Badge>
                          )}
                          {file.modified > 0 && (
                            <span className="text-[11px] text-muted-foreground/60">
                              &bull; {new Date(file.modified * 1000).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Button Controls */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          onClick={() =>
                            handlePlay(
                              file.path,
                              file.anime_title,
                              file.episode,
                              posterImg,
                              fileMeta.anilistId
                            )
                          }
                          className="rounded-xl h-9 px-4 bg-primary text-primary-foreground font-medium hover:bg-primary/90 gap-1.5 shadow-sm"
                        >
                          <Icon icon="solar:play-circle-bold" className="w-4 h-4" />
                          <span className="text-xs">Play Offline</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDownloadsFolder()}
                          className="rounded-xl h-9 px-3 gap-1.5 hover:bg-muted"
                          title="Show in folder"
                        >
                          <Icon icon="solar:folder-with-files-bold" className="w-4 h-4 text-muted-foreground" />
                          <span className="hidden sm:inline text-xs">Folder</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(file.path, file.filename)}
                          className="rounded-xl h-9 w-9 p-0 text-muted-foreground hover:text-red-400 hover:bg-red-950/20"
                          title="Delete file"
                        >
                          <Icon icon="solar:trash-bin-trash-bold" className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}