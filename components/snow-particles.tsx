"use client";

import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export function SnowParticles() {
  const { theme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Don't show on watch page
  if (theme !== "snow" || pathname?.includes("/watch")) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
      aria-hidden="true"
    >
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute top-[-50px] opacity-30 animate-fall bg-contain bg-no-repeat bg-center"
          style={{
            backgroundImage: "url('/lightbar-images/snowflake.svg')",
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 15 + 10}px`,
            height: `${Math.random() * 15 + 10}px`,
            animationDuration: `${Math.random() * 20 + 10}s`,
            animationDelay: `${Math.random() * 10}s`,
          }}
        />
      ))}
    </div>
  );
}
