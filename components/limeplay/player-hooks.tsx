"use client";

import React from "react";

import { useShakaPlayer } from "@/hooks/limeplay/use-shaka-player";
import { useVolumeStates } from "@/hooks/limeplay/use-volume";
import { useTimelineStates } from "@/hooks/limeplay/use-timeline";
import { useMediaStates } from "@/hooks/limeplay/use-media-state";
import { useCaptionsStates } from "@/hooks/limeplay/use-captions";


export const PlayerHooks = React.memo(() => {
  useShakaPlayer();
  useMediaStates();
  useVolumeStates();
  useTimelineStates();
  useCaptionsStates();

  return null;
});

PlayerHooks.displayName = "PlayerHooks";
