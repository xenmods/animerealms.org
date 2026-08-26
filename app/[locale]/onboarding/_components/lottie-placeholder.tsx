"use client";

import { motion } from "framer-motion";

interface LottiePlaceholderProps {
  label: string;
  width?: number;
  height?: number;
  query?: string;
}

export function LottiePlaceholder({
  label,
  width = 200,
  height = 200,
  query = "professional animation",
}: LottiePlaceholderProps) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="flex flex-col items-center justify-center gap-3"
    >
      <div
        style={{ width, height }}
        className="relative rounded-2xl bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 flex items-center justify-center overflow-hidden group"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            ease: "linear",
          }}
          className="absolute inset-0 bg-gradient-to-r from-primary/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <div className="relative z-10 flex flex-col items-center justify-center gap-2">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            className="text-4xl"
          >
            ✨
          </motion.div>
          <span className="text-xs font-medium text-muted-foreground text-center px-2">
            {label}
          </span>
          <span className="text-xs text-muted-foreground/60 text-center px-2">
            Lottie placeholder
          </span>
        </div>
        <motion.div
          className="absolute inset-0 rounded-2xl border-2 border-primary/0"
          animate={{
            borderColor: [
              "rgba(86, 120, 255, 0)",
              "rgba(86, 120, 255, 0.3)",
              "rgba(86, 120, 255, 0)",
            ],
          }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
        />
      </div>
    </motion.div>
  );
}
