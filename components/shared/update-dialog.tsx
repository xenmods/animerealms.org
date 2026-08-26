"use client";

import React, { useState, useEffect } from "react";
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
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { useSession } from "next-auth/react";
import {
  hasUserReviewed,
  submitReview,
  skipReview,
} from "@/lib/actions/review-actions";
import { StarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function UpdateDialog() {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    async function checkReviewStatus() {
      if (status === "authenticated" && session?.user?.name) {
        try {
          // Check if user has already reviewed
          const hasReviewed = await hasUserReviewed();
          if (!hasReviewed) {
            // Slight delay not to be too aggressive immediately on load
            setTimeout(() => setIsOpen(true), 2000);
          }
        } catch (error) {
          console.error("Failed to check review status", error);
        }
      }
    }

    if (status === "authenticated") {
      checkReviewStatus();
    }
  }, [status, session]);

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error("Please select a star rating!");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitReview(rating, message);
      setIsOpen(false);
      toast.success("Thank you for your feedback! 💖");
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    setIsOpen(false);
    try {
      await skipReview();
    } catch (error) {
      console.error("Failed to skip review", error);
    }
  };

  if (status !== "authenticated") return null;

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="px-3 max-h-[85vh] md:max-h-[90vh] md:max-w-md w-full overflow-auto bg-background/95 backdrop-blur-xl border-primary/20">
        <AlertDialogHeader>
          <div className="w-full h-32 relative mb-2 rounded-lg overflow-hidden flex items-center justify-center">
            <DotLottieReact
              className="w-full h-full"
              src="/pochita.lottie" // Reusing the cute lottie
              loop
              autoplay
            />
          </div>
          <AlertDialogTitle className="text-2xl font-bold text-center text-foreground">
            Enjoying the Realm?
          </AlertDialogTitle>
          <AlertDialogDescription className="text-center space-y-4">
            <div className="text-muted-foreground">
              We'd love to hear your thoughts! How are you finding your
              experience so far? (｡♥‿♥｡)
            </div>

            <div className="flex justify-center gap-2 py-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="transition-all hover:scale-110 active:scale-95 focus:outline-none"
                  type="button"
                >
                  <StarIcon
                    className={`w-8 h-8 ${
                      star <= (hoverRating || rating)
                        ? "fill-white text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        : "text-muted-foreground/30"
                    }`}
                  />
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Tell us what you love or what we can improve... (optional)"
              value={message}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setMessage(e.target.value)
              }
              className="bg-muted/50 border-primary/20 focus-visible:ring-primary/50 min-h-[70px]"
            />
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-col gap-2 w-full">
          <AlertDialogAction
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              handleSubmit();
            }}
            disabled={isSubmitting}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/20"
          >
            {isSubmitting ? "Sending..." : "Submit"}
          </AlertDialogAction>
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            No thanks
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
