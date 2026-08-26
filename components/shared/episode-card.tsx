import { motion } from "framer-motion";
import { Icon } from "@iconify/react";
import { useRouter } from "@/i18n/navigation";
import { useAnilist } from "@/lib/hooks/use-anilist";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useSession, signIn } from "next-auth/react";

const itemVariants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: "easeOut",
      stiffness: 100,
      damping: 15,
      duration: 0.3,
    },
  },
};

export function EpisodeCard({
  anime,
  backdrop_path = null,
  episode,
  progress,
}: {
  anime: Object;
  episode: any;
  backdrop_path?: string | null;
  progress: number;
}) {
  const [isDialogOpen, setDialogOpen] = useState(false);

  const t = useTranslations("AnimeDialog");
  const tShared = useTranslations("Shared");
  const { status: authStatus } = useSession();

  const handleConfirmClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Stop the click from bubbling
    toast.promise(markProgress(anime.id, episode.episode_number), {
      loading: "Marking episode as watched...",
      success: "Episode marked as watched!",
      error: "Failed to mark episode as watched.",
      position: "top-center",
    });
    setDialogOpen(false); // Manually close the dialog
  };

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDialogOpen(true); // Manually open the dialog
  };

  const router = useRouter();
  const { markProgress } = useAnilist();
  return (
    <motion.div
      variants={itemVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      onClick={() => {
        router.push(`/watch/${anime.id}/${episode.episode_number}`);
      }}
      className={`group relative flex cursor-pointer flex-col gap-2 rounded-xl p-2 transition-all duration-300 hover:scale-95 hover:bg-accent`}
    >
      <div className="relative aspect-video overflow-hidden rounded-lg transition-transform duration-300 ease-out group-hover:shadow-2xl">
        <img
          src={`${
            episode.still_path || backdrop_path || anime.coverImage.large
          }`}
          alt={episode.name}
          className={`h-full w-full object-cover ${
            progress >= episode.episode_number ? "opacity-20" : "opacity-100"
          }`}
        />
        <AlertDialog open={isDialogOpen} onOpenChange={setDialogOpen}>
          <AlertDialogTrigger asChild>
            <button
              className="absolute left-2 top-2 flex h-10 w-10 items-center justify-center rounded-full bg-transparent text-foreground opacity-0 backdrop-blur-sm transition-all duration-200 group-hover:opacity-100 group-hover:bg-background/60 hover:scale-110 hover:bg-accent z-[100]"
              aria-label="Eye"
              onClick={handleTriggerClick}
            >
              <Icon icon="solar:eye-linear" className="text-xl" />
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent
            onClick={(e) => e.stopPropagation()}
            overlayProps={{ onClick: (e) => e.stopPropagation() }}
          >
            <AlertDialogHeader>
              <AlertDialogTitle>
                {authStatus === "authenticated"
                  ? t("mark-watched-title")
                  : tShared("signIn")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {authStatus === "authenticated"
                  ? t("mark-watched-description", {
                      episodeNumber: episode.episode_number,
                    })
                  : tShared("listprompt")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel
                onClick={(e) => {
                  e.stopPropagation();
                  setDialogOpen(false);
                }}
              >
                {tShared("cancel")}
              </AlertDialogCancel>
              {/* 6. Use our new handler here */}
              <AlertDialogAction
                onClick={
                  authStatus === "authenticated"
                    ? handleConfirmClick
                    : () => {
                        router.push("/login");
                      }
                }
              >
                {authStatus === "authenticated"
                  ? tShared("confirm")
                  : tShared("signIn")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <div className="absolute right-2 top-2 rounded bg-background/60 px-2 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
          {`E${episode.episode_number}`}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 text-sm font-semibold leading-tight">
            {episode.episode_number}. {episode.name}
          </h3>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-2">
          {episode.overview}
        </p>
      </div>
    </motion.div>
  );
}
