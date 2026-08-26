"use client";

import { useMotionContext } from "@/components/motion-provider";
import { useEffect } from "react";

export function ReducedMotionWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isReducedMotion } = useMotionContext();

  useEffect(() => {
    if (isReducedMotion) {
      document.body.classList.add("reduced-motion");
    } else {
      document.body.classList.remove("reduced-motion");
    }
  }, [isReducedMotion]);

  return <>{children}</>;
}
