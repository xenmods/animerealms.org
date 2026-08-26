"use client";

import { THEMES } from "@/lib/consts";

function ThemePreview({
  theme,
  currentTheme,
  setTheme,
}: {
  theme: string;
  currentTheme?: string;
  setTheme: (theme: string) => void;
}) {
  const isActive = currentTheme === theme;

  return (
    <div
      role="button"
      onClick={() => setTheme(theme)}
      className={`scroll-mt-32 min-w-[150px] w-full h-32 relative rounded-[8px] border bg-gradient-to-br from-primary/20 to-secondary/10 bg-clip-content transition-colors duration-150 border-primary/30 cursor-pointer ${theme} overflow-hidden`}
    >
      <div className="absolute top-2 left-2">
        <div className="h-5 w-5 bg-primary rounded-full"></div>
        <div className="h-5 w-5 bg-secondary rounded-full -mt-2"></div>
      </div>

      {isActive && (
        <span className="absolute top-3 right-3 text-xs text-foreground transition-opacity duration-150 opacity-100">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="1em"
            width="1em"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M9 22l-10-10.598 2.798-2.859 7.149 7.473 13.144-14.016 2.909 2.806z"></path>
          </svg>
        </span>
      )}

      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-3/5 h-4/5 rounded-t-lg -mb-px bg-background overflow-hidden">
        <div className="relative w-full h-full">
          <div className="bg-primary/50 w-[130%] h-10 absolute left-1/2 -top-5 blur-xl transform -translate-x-1/2 rounded-[100%]"></div>

          {/* Top navigation dots */}
          <div className="p-2 flex justify-between items-center">
            <div className="flex space-x-1">
              <div className="bg-muted w-4 h-2 rounded-full"></div>
              <div className="bg-muted w-2 h-2 rounded-full"></div>
              <div className="bg-muted w-2 h-2 rounded-full"></div>
            </div>
            <div className="bg-muted w-2 h-2 rounded-full"></div>
          </div>

          {/* Content lines */}
          <div className="mt-1 flex items-center flex-col gap-1">
            <div className="bg-muted w-8 h-0.5 rounded-full"></div>
            <div className="bg-muted w-6 h-0.5 rounded-full"></div>
            <div className="bg-muted w-16 h-2 mt-1 rounded-full"></div>
          </div>

          {/* Bottom items */}
          <div className="mt-5 px-3">
            <div className="flex gap-1 items-center">
              <div className="bg-muted w-2 h-2 rounded-full"></div>
              <div className="bg-muted w-8 h-0.5 rounded-full"></div>
            </div>
            <div className="flex w-full gap-1 mt-1">
              <div className="bg-muted h-2 w-3 rounded-full"></div>
              <div className="bg-muted h-2 w-3 rounded-full"></div>
              <div className="bg-muted h-2 w-3 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-2 left-3 text-foreground text-xs font-medium capitalize">
        {THEMES[theme]}
      </div>
    </div>
  );
}

export { ThemePreview };
