"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

// Helper function to format time, since we're now doing it inside the slider.
const formatTime = (timeInSeconds) => {
  if (isNaN(timeInSeconds)) return "00:00";
  const time = Math.floor(timeInSeconds);
  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(time % 60)
    .toString()
    .padStart(2, "0");
  return hours > 0 ? `${hours}:${minutes}:${seconds}` : `${minutes}:${seconds}`;
};

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> & {
    timeString?: string;
    timeClass?: string;
    duration?: number;
    thumbnails?: Record<number, string>;
    buffered?: number;
    skipTimes?: any[];
  }
>(
  (
    {
      className,
      timeString,
      timeClass,
      duration = 0,
      thumbnails = {},
      buffered = 0,
      skipTimes = [],
      ...props
    },
    ref
  ) => {
    const trackRef = React.useRef<HTMLSpanElement>(null);
    const [preview, setPreview] = React.useState({
      visible: false,
      imageUrl: null as string | null,
      time: "00:00",
      leftOffset: 0,
      label: null as string | null,
    });

    const bufferedPercentage = duration > 0 ? (buffered / duration) * 100 : 0;

    React.useEffect(() => {
      const track = trackRef.current;
      if (!track || !duration) return;

      const sortedTimes = Object.keys(thumbnails)
        .map(Number)
        .sort((a, b) => a - b);

      const handleMouseMove = (e: MouseEvent) => {
        const rect = track.getBoundingClientRect();
        const percent =
          Math.min(Math.max(0, e.clientX - rect.left), rect.width) / rect.width;
        const timeInSeconds = Math.floor(percent * duration);

        let closestTime = 0;
        for (const thumbTime of sortedTimes) {
          if (thumbTime <= timeInSeconds) {
            closestTime = thumbTime;
          } else {
            break;
          }
        }

        const MAX_DISTANCE_SECONDS = 40;
        let finalImageUrl = null;

        if (timeInSeconds - closestTime <= MAX_DISTANCE_SECONDS) {
          finalImageUrl = thumbnails[closestTime] || null;
        }

        let skipLabel = null;
        if (skipTimes && skipTimes.length > 0) {
          const hoveredSkip = skipTimes.find((skip) => {
            const { startTime, endTime } = skip.interval;
            return timeInSeconds >= startTime && timeInSeconds < endTime;
          });

          if (hoveredSkip) {
            switch (hoveredSkip.skipType) {
              case "op":
              case "mixed-op":
                skipLabel = "Intro";
                break;
              case "ed":
              case "mixed-ed":
                skipLabel = "Outro";
                break;
              case "recap":
                skipLabel = "Recap";
                break;
              default:
                break; // Or generic "Skip"
            }
          }
        }

        setPreview({
          visible: true,
          imageUrl: finalImageUrl,
          time: formatTime(timeInSeconds),
          leftOffset: percent * rect.width,
          label: skipLabel,
        });
      };

      const handleMouseLeave = () => {
        setPreview((p) => ({ ...p, visible: false }));
      };

      track.addEventListener("mousemove", handleMouseMove);
      track.addEventListener("mouseleave", handleMouseLeave);

      return () => {
        track.removeEventListener("mousemove", handleMouseMove);
        track.removeEventListener("mouseleave", handleMouseLeave);
      };
    }, [trackRef, duration, thumbnails, skipTimes]);

    return (
      <SliderPrimitive.Root
        ref={ref}
        className={cn(
          "relative flex w-full touch-none select-none items-center group",
          props.orientation === "vertical" && "flex-col h-24 w-5",
          className
        )}
        {...props}
      >
        <SliderPrimitive.Track
          ref={trackRef}
          className={cn(
            "relative h-1.5 hover:h-2 w-full grow overflow-hidden rounded-full bg-primary/20 transition-[height] duration-200",
            props.orientation === "vertical" && "h-full w-[3px]"
          )}
        >
          <div
            className="absolute h-full rounded-full bg-white/30"
            style={{ width: `${bufferedPercentage}%` }}
          />

          <SliderPrimitive.Range
            className={cn(
              "absolute h-full bg-primary",
              props.orientation === "vertical" && "w-full"
            )}
          />

          {/* --- Skip Segments --- */}
          {duration > 0 &&
            skipTimes.map((skip, index) => {
              const { startTime, endTime } = skip.interval;
              const startPercent = (startTime / duration) * 100;
              const widthPercent = ((endTime - startTime) / duration) * 100;

              // Optional: color code based on type
              let colorClass = "bg-yellow-400/60"; // Default
              // if (skip.skipType === "op") colorClass = "bg-blue-400/60";
              // else if (skip.skipType === "ed") colorClass = "bg-purple-400/60";

              return (
                <div
                  key={skip.skipId || index}
                  className={cn("absolute h-full z-10", colorClass)}
                  style={{
                    left: `${startPercent}%`,
                    width: `${widthPercent}%`,
                  }}
                />
              );
            })}
        </SliderPrimitive.Track>

        <SliderPrimitive.Thumb
          className={cn(
            "relative block h-4 w-4 rounded-full border border-primary/50 bg-background shadow transition-colors",
            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            "disabled:pointer-events-none disabled:opacity-50"
          )}
        >
          {timeString && !preview.visible && (
            <div className={timeClass}>{timeString}</div>
          )}
        </SliderPrimitive.Thumb>

        {/* Preview logic is the same, but now uses internal state */}
        {preview.visible && (
          <div
            className="absolute bottom-full mb-4 flex flex-col items-center pointer-events-none"
            style={{
              left: `${preview.leftOffset || 0}px`,
              transform: "translateX(-50%)",
            }}
          >
            {preview.imageUrl && (
              <div className="rounded-xl border border-border bg-black w-[160px] h-[90px] flex items-center justify-center overflow-hidden shadow-lg">
                <img
                  src={preview.imageUrl}
                  alt="Video thumbnail"
                  className="w-full h-full"
                />
              </div>
            )}

            {preview.time && (
              <span className="text-xs text-white mt-2">
                {preview.label ? (
                  <span className={`font-bold text-yellow-400 mr-1`}>
                    {preview.label} •
                  </span>
                ) : null}
                {preview.time}
              </span>
            )}
          </div>
        )}
      </SliderPrimitive.Root>
    );
  }
);
Slider.displayName = SliderPrimitive.Root.displayName;

export { Slider };
