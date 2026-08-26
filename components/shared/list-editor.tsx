"use client";

import * as React from "react";
import { motion } from "motion/react";
import {
  useAnilist,
  type SaveMediaListEntryInput,
  type MediaListEntryData,
  type MediaListStatus,
  type FuzzyDateInput,
} from "@/lib/hooks/use-anilist";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CalendarIcon, Minus, Plus } from "lucide-react";
import { format as formatDate } from "date-fns";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogTrigger,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";

const getScoreMax = (format = "POINT_100"): number => {
  switch (format) {
    case "POINT_100":
      return 100;
    case "POINT_10_DECIMAL":
      return 10;
    case "POINT_10":
      return 10;
    case "POINT_5":
      return 5;
    case "POINT_3":
      return 3;
    default:
      return 100;
  }
};

const formatScore = (score: number, format = "POINT_100"): number => {
  if (format === "POINT_10_DECIMAL") return score / 10;
  if (format === "POINT_10") return Math.round(score / 10);
  if (format === "POINT_5") return Math.round(score / 20);
  if (format === "POINT_3") return Math.round(score / 33.3);
  return score;
};

const unformatScore = (
  formattedScore: number,
  format = "POINT_100",
): number => {
  console.clear();
  console.log("Unformatting score:", formattedScore, format);
  const max = getScoreMax(format);
  console.log("Max score for format:", max);
  if (formattedScore === 0 || formattedScore > max) {
    console.log("Returning 0 due to invalid score");
    return 0;
  }

  if (format === "POINT_10_DECIMAL") return formattedScore * 10;
  if (format === "POINT_10") {
    console.log("POINT_10 unformatting");
    console.log("Formatted score:", formattedScore);
    console.log("Unformatted score:", formattedScore * 10);
    return formattedScore * 10;
  }
  if (format === "POINT_5") return formattedScore * 20;
  if (format === "POINT_3") {
    if (formattedScore === 3) return 100;
    if (formattedScore === 2) return 66;
    if (formattedScore === 1) return 33;
  }
  return formattedScore;
};

const toFuzzyDate = (date: Date | undefined): FuzzyDateInput | undefined => {
  if (!date) return {};
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
};

const fromFuzzyDate = (
  fuzzyDate: FuzzyDateInput | undefined,
): Date | undefined => {
  if (!fuzzyDate?.year || !fuzzyDate?.month || !fuzzyDate?.day) {
    return undefined;
  }
  return new Date(fuzzyDate.year, fuzzyDate.month - 1, fuzzyDate.day);
};

interface ListEditorProps {
  children: React.ReactNode;
  mediaId: number;
  onSaveSuccess?: () => void;
}

interface AnimeInfo {
  title: string;
  coverImage: string | null;
}

const fetchAnimeInfo = async (mediaId: number): Promise<AnimeInfo> => {
  const query = `
    query ($id: Int!) {
      Media(id: $id) {
        title {
          userPreferred
        }
        coverImage {
          large
          medium
        }
      }
    }
  `;

  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables: { id: mediaId } }),
  });

  if (!response.ok) throw new Error("Failed to fetch anime info");

  const data = await response.json();
  if (data.errors) throw new Error(data.errors[0].message);

  const media = data.data.Media;
  return {
    title: media.title.userPreferred,
    coverImage: media.coverImage?.large || media.coverImage?.medium || null,
  };
};

export const ListEditor: React.FC<ListEditorProps> = ({
  children,
  mediaId,
  onSaveSuccess,
}) => {
  const {
    getMediaListEntry,
    getViewerOptions,
    saveMediaListEntry,
    deleteMediaListEntry,
  } = useAnilist();

  const [open, setOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState<MediaListEntryData | null>(
    null,
  );
  const [scoreFormat, setScoreFormat] = React.useState<string>("POINT_100");
  const [animeInfo, setAnimeInfo] = React.useState<AnimeInfo | null>(null);

  const t = useTranslations("ListEditor");
  const tShared = useTranslations("Shared");
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();

  const statusOptions: { label: string; value: MediaListStatus }[] = [
    { label: t("watching"), value: "CURRENT" },
    { label: t("completed"), value: "COMPLETED" },
    { label: t("paused"), value: "PAUSED" },
    { label: t("dropped"), value: "DROPPED" },
    { label: t("planning"), value: "PLANNING" },
    { label: t("rewatching"), value: "REPEATING" },
  ];

  React.useEffect(() => {
    if (open) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const [entryData, optionsData, animeData] = await Promise.all([
            getMediaListEntry(mediaId),
            getViewerOptions(),
            fetchAnimeInfo(mediaId),
          ]);

          let currentFormat = "POINT_100";
          if (optionsData) {
            currentFormat = optionsData.scoreFormat;
            setScoreFormat(optionsData.scoreFormat);
          }

          if (entryData) {
            const normalizedScore = unformatScore(
              entryData.score,
              currentFormat,
            );
            setFormData({ ...entryData, score: normalizedScore });
          }

          if (animeData) {
            setAnimeInfo(animeData);
          }
        } catch (err: any) {
          setError(err.message || t("fetchDataError"));
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
    }
  }, [open, mediaId, getMediaListEntry, getViewerOptions, t]);

  const handleFieldChange = (field: string, value: any) => {
    if (!formData) return;
    setFormData({ ...formData, [field]: value });
  };

  const handleProgressChange = (amount: number) => {
    if (!formData) return;
    const newProgress = Math.max(0, formData.progress + amount);
    const maxEpisodes = formData.media.episodes;

    if (maxEpisodes && newProgress > maxEpisodes) {
      handleFieldChange("progress", maxEpisodes);
    } else {
      handleFieldChange("progress", newProgress);
    }
  };

  const handleSave = async () => {
    if (!formData) return;

    setIsSaving(true);
    setError(null);

    const saveData: SaveMediaListEntryInput = {
      status: formData.status === "NONE" ? undefined : formData.status,
      score: formatScore(formData.score, scoreFormat),
      progress: formData.progress,
      repeat: formData.repeat,
      private: formData.private,
      notes: formData.notes,
      startedAt: toFuzzyDate(fromFuzzyDate(formData.startedAt)),
      completedAt: toFuzzyDate(fromFuzzyDate(formData.completedAt)),
    };

    try {
      console.log("Saving data:", saveData);
      console.log(
        "Score:",
        unformatScore(formData.score, scoreFormat),
        "Format:",
        scoreFormat,
      );
      toast.promise(saveMediaListEntry(mediaId, saveData), {
        loading: t("saving"),
        success: t("saveSuccess"),
        error: t("saveError"),
        position: "top-center",
      });
      // await ;
      setOpen(false);
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (err: any) {
      setError(err.message || t("saveEntryError"));
    } finally {
      setIsSaving(false);
    }
  };

  const maxScore = getScoreMax(scoreFormat);
  const totalEpisodes = formData?.media.episodes;
  const coverImageUrl =
    animeInfo?.coverImage ||
    formData?.media.coverImage?.large ||
    formData?.media.coverImage?.medium;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent
        onClick={(e) => e.stopPropagation()}
        overlayProps={{ onClick: (e) => e.stopPropagation() }}
        className="sm:max-w-[75vw] max-h-[90vh] bg-background p-0 overflow-auto no-scrollbar"
      >
        {isLoading && authStatus === "loading" && (
          <div className="flex h-96 items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Number.POSITIVE_INFINITY, duration: 1 }}
            >
              <Loader2 className="h-12 w-12" />
            </motion.div>
          </div>
        )}

        {authStatus === "unauthenticated" && (
          <div className="flex h-96 items-center justify-center">
            {/* ask user to login */}
            <div className="text-center flex flex-col items-center justify-center">
              <h1 className="text-xl">
                {tShared("signIn")}{" "}
                <span className="text-muted-foreground">☜(⌒▽⌒)☞</span>
              </h1>
              <p className="text-md text-muted-foreground">
                {tShared("listprompt")}
              </p>
              <Button
                variant="secondary"
                className="mt-2 flex items-center gap-1"
                size="sm"
                onClick={() => router.push("/login")}
              >
                <svg
                  className="w-6 h-auto"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  preserveAspectRatio="xMidYMid"
                  viewBox="0 0 172 172"
                >
                  <defs>
                    <style
                      dangerouslySetInnerHTML={{
                        __html:
                          "\n      .cls-1 {\n        fill: #02a9ff;\n      }\n\n      .cls-1, .cls-2 {\n        fill-rule: evenodd;\n      }\n\n      .cls-2 {\n        fill: #fefefe;\n      }\n    ",
                      }}
                    />
                  </defs>
                  <g>
                    <path
                      d="M111.322,111.157 L111.322,41.029 C111.322,37.010 109.105,34.792 105.086,34.792 L91.365,34.792 C87.346,34.792 85.128,37.010 85.128,41.029 C85.128,41.029 85.128,56.337 85.128,74.333 C85.128,75.271 94.165,79.626 94.401,80.547 C101.286,107.449 95.897,128.980 89.370,129.985 C100.042,130.513 101.216,135.644 93.267,132.138 C94.483,117.784 99.228,117.812 112.869,131.610 C112.986,131.729 115.666,137.351 115.833,137.351 C131.170,137.351 148.050,137.351 148.050,137.351 C152.069,137.351 154.286,135.134 154.286,131.115 L154.286,117.394 C154.286,113.375 152.069,111.157 148.050,111.157 L111.322,111.157 Z"
                      className="cls-1"
                    />
                    <path
                      d="M54.365,34.792 L18.331,137.351 L46.327,137.351 L52.425,119.611 L82.915,119.611 L88.875,137.351 L116.732,137.351 L80.836,34.792 L54.365,34.792 ZM58.800,96.882 L67.531,68.470 L77.094,96.882 L58.800,96.882 Z"
                      className="cls-2"
                    />
                  </g>
                </svg>
                {tShared("signIn")}
              </Button>
            </div>
          </div>
        )}

        {!isLoading && formData && authStatus === "authenticated" && (
          <>
            {coverImageUrl && (
              <motion.div
                className="md:hidden relative w-full h-40 overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src={coverImageUrl || "/placeholder.svg"}
                  alt={animeInfo?.title || t("animeCover")}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              </motion.div>
            )}

            <div className="flex flex-col xl:flex-row md:gap-6 p-6">
              {coverImageUrl && (
                <motion.div
                  className="hidden md:block flex-shrink-0 w-40"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <img
                    src={coverImageUrl || "/placeholder.svg"}
                    alt={animeInfo?.title || t("animeCover")}
                    className="w-full rounded-lg shadow-lg object-cover aspect-[3/4]"
                  />
                </motion.div>
              )}

              <div className="flex-1 min-w-0">
                <DialogHeader className="mb-6 text-left">
                  <DialogTitle className="text-2xl">
                    {animeInfo?.title || t("editEntry")}
                  </DialogTitle>
                  <DialogDescription className="text-base pt-1">
                    {t("updateEntry")}
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSave();
                  }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Status */}
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Label htmlFor="status">{t("status")}</Label>
                      <Select
                        value={
                          formData.status === "NONE" ? "" : formData.status
                        }
                        onValueChange={(value) =>
                          handleFieldChange("status", value)
                        }
                      >
                        <SelectTrigger id="status" className="w-full">
                          <SelectValue placeholder={t("selectStatus")} />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                    >
                      <Label
                        htmlFor="score"
                        className="flex items-center justify-between"
                      >
                        <span>{t("score")}</span>
                        <span className="text-lg font-semibold text-primary">
                          {formatScore(formData.score, scoreFormat)}/{maxScore}
                        </span>
                      </Label>
                      <div className="pt-2">
                        <input
                          id="score"
                          type="range"
                          value={formatScore(formData.score, scoreFormat)}
                          onChange={(e) =>
                            handleFieldChange(
                              "score",
                              unformatScore(
                                Number.parseFloat(e.target.value) || 0,
                                scoreFormat,
                              ),
                            )
                          }
                          min="0"
                          max={maxScore}
                          step={
                            scoreFormat === "POINT_10_DECIMAL" ? "0.1" : "1"
                          }
                          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                      </div>
                    </motion.div>

                    {/* Start Date */}
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Label htmlFor="start-date">{t("startDate")}</Label>
                      <DatePicker
                        value={fromFuzzyDate(formData.startedAt)}
                        onChange={(date) =>
                          handleFieldChange("startedAt", toFuzzyDate(date))
                        }
                      />
                    </motion.div>

                    {/* Finish Date */}
                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.25 }}
                    >
                      <Label htmlFor="finish-date">{t("finishDate")}</Label>
                      <DatePicker
                        value={fromFuzzyDate(formData.completedAt)}
                        onChange={(date) =>
                          handleFieldChange("completedAt", toFuzzyDate(date))
                        }
                      />
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Label
                        htmlFor="progress"
                        className="flex items-center justify-between"
                      >
                        <span>{t("episodeProgress")}</span>
                        <span className="text-sm font-medium text-muted-foreground">
                          {formData.progress}
                          {totalEpisodes ? ` / ${totalEpisodes}` : ""}
                        </span>
                      </Label>
                      <div className="space-y-2">
                        {totalEpisodes && (
                          <div className="h-1 bg-muted rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-primary"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${
                                  (formData.progress / totalEpisodes) * 100
                                }%`,
                              }}
                              transition={{ duration: 0.3 }}
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 flex-shrink-0 bg-transparent"
                            onClick={() => handleProgressChange(-1)}
                            disabled={formData.progress <= 0}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <input
                            id="progress"
                            type="range"
                            value={formData.progress}
                            onChange={(e) => {
                              const val = Number.parseInt(e.target.value, 10);
                              if (!isNaN(val)) {
                                const newVal = totalEpisodes
                                  ? Math.min(val, totalEpisodes)
                                  : val;
                                handleFieldChange(
                                  "progress",
                                  Math.max(0, newVal),
                                );
                              }
                            }}
                            min="0"
                            max={totalEpisodes ?? 999}
                            className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="h-9 w-9 flex-shrink-0 bg-transparent"
                            onClick={() => handleProgressChange(1)}
                            disabled={
                              !!totalEpisodes &&
                              formData.progress >= totalEpisodes
                            }
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>

                    <motion.div
                      className="space-y-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                    >
                      <Label
                        htmlFor="rewatches"
                        className="flex items-center justify-between"
                      >
                        <span>{t("totalRewatches")}</span>
                        <span className="text-lg font-semibold text-primary">
                          {formData.repeat}
                        </span>
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 bg-transparent"
                          onClick={() =>
                            handleFieldChange(
                              "repeat",
                              Math.max(0, formData.repeat - 1),
                            )
                          }
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <div className="flex-1 flex items-center justify-center py-2 px-3 rounded-md bg-muted text-lg font-semibold">
                          {formData.repeat}
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="h-9 w-9 bg-transparent"
                          onClick={() =>
                            handleFieldChange("repeat", formData.repeat + 1)
                          }
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  </div>

                  {/* Notes - Full Width */}
                  <motion.div
                    className="space-y-2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Label htmlFor="notes">{t("notes")}</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes || ""}
                      onChange={(e) =>
                        handleFieldChange("notes", e.target.value)
                      }
                      className="min-h-[100px]"
                      placeholder={t("notesPlaceholder")}
                    />
                  </motion.div>

                  {/* Private Checkbox */}
                  <div className="flex justify-between w-full items-center">
                    <motion.div
                      className="flex items-center gap-2 pt-2"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.45 }}
                    >
                      <Checkbox
                        id="private"
                        checked={formData.private}
                        onCheckedChange={(checked) =>
                          handleFieldChange("private", !!checked)
                        }
                      />
                      <Label htmlFor="private" className="font-medium">
                        {t("private")}
                      </Label>
                    </motion.div>
                    {formData.id && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size={"sm"}
                            type="button"
                            variant="destructive"
                          >
                            {t("deleteEntry")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("deleteConfirmation")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("deleteWarning")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {tShared("cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                toast.promise(
                                  async () => {
                                    if (!formData?.id)
                                      throw new Error("No entry to delete");
                                    const result = await deleteMediaListEntry(
                                      formData.id,
                                    );
                                    if (!result?.deleted)
                                      throw new Error("Failed to delete entry");
                                    return result;
                                  },
                                  {
                                    loading: t("deleting"),
                                    success: t("deleteSuccess"),
                                    error: t("deleteError"),
                                    position: "top-center",
                                  },
                                );
                                setOpen(false);
                              }}
                            >
                              {tShared("confirm")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  <DialogFooter className="mt-8 pt-6 border-t">
                    <Button
                      type="button"
                      variant={"secondary"}
                      onClick={() => setOpen(false)}
                    >
                      {tShared("cancel")}
                    </Button>
                    <Button type="submit" disabled={isSaving}>
                      {isSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("saveChanges")}
                    </Button>
                  </DialogFooter>
                </form>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

interface DatePickerProps {
  value?: Date;
  onChange: (date?: Date) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange }) => {
  const t = useTranslations("ListEditor");
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? formatDate(value, "PPP") : <span>{t("pickDate")}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
};
