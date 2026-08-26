"use client";

import React, { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "donation-dismissed";
const DISMISS_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export function DonationButton() {
  const [isVisible, setIsVisible] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    const checkVisibility = () => {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      if (!dismissedAt) {
        setIsVisible(true);
        return;
      }

      const timestamp = parseInt(dismissedAt, 10);
      const now = Date.now();

      if (now - timestamp > DISMISS_DURATION) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    checkVisibility();
  }, []);

  const handleDismiss = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsDialogOpen(false);
    setIsVisible(false);
    localStorage.setItem(DISMISS_KEY, Date.now().toString());
  };

  const handleSupport = () => {
    window.open("https://ko-fi.com/animerealmsorg", "_blank");
  };

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 left-4 z-50 group"
          >
            <div
              onClick={() => setIsDialogOpen(true)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full",
                "bg-primary hover:bg-primary/90 text-primary-foreground font-medium",
                "shadow-lg hover:shadow-xl transition-all duration-300",
                "border border-primary/20",
                "cursor-pointer"
              )}
            >
              <Icon icon="simple-icons:kofi" className="w-5 h-5" />
              <span>Support us</span>

              <button
                onClick={handleDismiss}
                className="ml-1 p-0.5 rounded-full hover:bg-black/20 transition-colors z-20"
                aria-label="Dismiss donation button"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md" showCloseButton={false}>
          <DialogHeader className="text-center">
            <DialogTitle className="text-center sm:text-2xl">
              Support Anime Realms
            </DialogTitle>
            <DialogDescription className="pt-2 text-base text-center">
              We are committed to providing content for free{" "}
              <strong>WITHOUT ads</strong> and we hate them just as much as you
              do. However, servers cost money. A little help would be greatly
              appreciated to keep us running!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 mt-4">
            <Button variant="outline" onClick={() => handleDismiss()}>
              Close
            </Button>
            <Button onClick={handleSupport} className="gap-2">
              <Icon icon="simple-icons:kofi" className="w-4 h-4" />
              Support on Ko-fi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
