"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "next-themes";

type ThemeTransitionContextType = {
  changeTheme: (theme: string) => void;
  isTransitioning: boolean;
};

const ThemeTransitionContext = createContext<ThemeTransitionContextType | null>(
  null
);

export function useThemeTransition() {
  const context = useContext(ThemeTransitionContext);
  if (!context) {
    throw new Error(
      "useThemeTransition must be used within a ThemeTransitionProvider"
    );
  }
  return context;
}

export function ThemeTransitionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setTheme } = useTheme();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [targetTheme, setTargetTheme] = useState<string | null>(null);

  // States: IDLE -> SCALING_DOWN -> MOVING_CURTAINS_IN -> SWITCHING_THEME -> MOVING_CURTAINS_OUT -> SCALING_UP -> IDLE
  const [animationStage, setAnimationStage] = useState<
    | "IDLE"
    | "SCALING_DOWN"
    | "CURTAINS_IN"
    | "LOGO_ANIMATION"
    | "CURTAINS_OUT"
    | "SCALING_UP"
  >("IDLE");

  const changeTheme = (newTheme: string) => {
    if (isTransitioning) return;

    // Check for reduced motion preference
    const shouldReduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (shouldReduceMotion) {
      setTheme(newTheme);
      return;
    }

    setTargetTheme(newTheme);
    setIsTransitioning(true);
    setAnimationStage("SCALING_DOWN");
  };

  useEffect(() => {
    if (animationStage === "SCALING_DOWN") {
      const timeout = setTimeout(() => {
        setAnimationStage("CURTAINS_IN");
      }, 500); // Wait for scale down
      return () => clearTimeout(timeout);
    }

    if (animationStage === "CURTAINS_IN") {
      const timeout = setTimeout(() => {
        setAnimationStage("LOGO_ANIMATION");
      }, 500); // Wait for curtains to close
      return () => clearTimeout(timeout);
    }

    if (animationStage === "LOGO_ANIMATION") {
      if (targetTheme) {
        // Apply theme change here, so it happens behind the full curtains/logo
        setTheme(targetTheme);
      }
      // Wait for the circle animation (draw + undraw)
      // total duration approx 1.2s
      const timeout = setTimeout(() => {
        setAnimationStage("CURTAINS_OUT");
      }, 2000);
      return () => clearTimeout(timeout);
    }

    if (animationStage === "CURTAINS_OUT") {
      const timeout = setTimeout(() => {
        setAnimationStage("SCALING_UP");
      }, 500); // Wait for curtains to open
      return () => clearTimeout(timeout);
    }

    if (animationStage === "SCALING_UP") {
      const timeout = setTimeout(() => {
        setAnimationStage("IDLE");
        setIsTransitioning(false);
        setTargetTheme(null);
      }, 500); // Wait for scale up
      return () => clearTimeout(timeout);
    }
  }, [animationStage, targetTheme, setTheme]);

  // Animation variants
  const containerVariants = {
    idle: { scale: 1, borderRadius: 0 },
    scaled: {
      scale: 0.95,
      borderRadius: "12px",
      overflow: "hidden", // Important for rounded corners
      filter: "blur(4px)",
      rotateX: 2,
      boxShadow: "0 40px 80px -20px rgba(0, 0, 0, 0.5)",
    },
  };

  return (
    <ThemeTransitionContext.Provider value={{ changeTheme, isTransitioning }}>
      <div
        className="relative w-full h-full bg-background transition-colors duration-300 overflow-x-hidden"
        style={{ perspective: "1000px" }}
      >
        {/* Main Content Wrapper */}
        <motion.div
          className="w-full h-full origin-center shadow-2xl"
          // We use shadow just in case, though bg-background usually covers it.
          // Adding a border or shadow helps separate it from the "void" background during scale.
          // However, if the parent background matches, it might not be visible.
          // Usually a dark background behind the scaled content looks good.
          variants={containerVariants}
          initial="idle"
          animate={
            animationStage === "SCALING_DOWN" ||
            animationStage === "CURTAINS_IN" ||
            animationStage === "LOGO_ANIMATION" ||
            animationStage === "CURTAINS_OUT"
              ? "scaled"
              : "idle"
          }
          transition={{ duration: 0.5, ease: "easeInOut" }}
          style={{
            height: "100%",
            width: "100%",
          }}
        >
          {children}
        </motion.div>

        {/* Curtains */}
        <AnimatePresence>
          {(animationStage === "CURTAINS_IN" ||
            animationStage === "LOGO_ANIMATION" ||
            animationStage === "CURTAINS_OUT") && (
            <>
              {/* Left Curtain */}
              <motion.div
                key="left-curtain"
                initial={{ x: "-100%" }}
                animate={{
                  x:
                    animationStage === "CURTAINS_IN" ||
                    animationStage === "LOGO_ANIMATION"
                      ? "0%"
                      : "-100%",
                }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="fixed top-0 left-0 bottom-0 w-[50vw] bg-background z-[9999] pointer-events-none flex items-center justify-end transition-colors duration-300"
              >
                {/* Left Half of Logo (Semi-circle) */}
                <div className="relative h-24 w-12 overflow-hidden rounded-l-full bg-background">
                  <img
                    src="/logo.jpg"
                    alt=""
                    className="absolute top-0 left-0 h-full w-24 max-w-none object-cover"
                  />
                </div>
              </motion.div>

              {/* Right Curtain */}
              <motion.div
                key="right-curtain"
                initial={{ x: "100%" }}
                animate={{
                  x:
                    animationStage === "CURTAINS_IN" ||
                    animationStage === "LOGO_ANIMATION"
                      ? "0%"
                      : "100%",
                }}
                exit={{ x: "100%" }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="fixed top-0 right-0 bottom-0 w-[50vw] bg-background z-[9999] pointer-events-none flex items-center justify-start transition-colors duration-300"
              >
                {/* Right Half of Logo (Semi-circle) */}
                <div className="relative h-24 w-12 overflow-hidden rounded-r-full bg-background">
                  <img
                    src="/logo.jpg"
                    alt=""
                    className="absolute top-0 right-0 h-full w-24 max-w-none object-cover"
                  />
                </div>
              </motion.div>
            </>
          )}

          {/* Logo Animation Circle */}
          <AnimatePresence>
            {animationStage === "LOGO_ANIMATION" && (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-10000 flex items-center justify-center pointer-events-none"
              >
                <svg
                  width="110"
                  height="110"
                  viewBox="0 0 110 110"
                  className="w-[110px] h-[110px]"
                >
                  <motion.circle
                    cx="55"
                    cy="55"
                    r="53"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="transparent"
                    className="text-foreground"
                    initial={{ pathLength: 0, pathOffset: 0 }}
                    animate={{
                      pathLength: [0, 1, 0],
                      pathOffset: [0, 0, 1],
                    }}
                    transition={{
                      duration: 1.6,
                      times: [0, 0.5, 1],
                      ease: "easeInOut",
                    }}
                  />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </AnimatePresence>
      </div>
    </ThemeTransitionContext.Provider>
  );
}
