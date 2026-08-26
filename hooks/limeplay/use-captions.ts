"use client";

import { useCallback, useEffect } from "react";
import type shaka from "shaka-player";
import type { StateCreator } from "zustand";

import type { PlayerStore } from "@/hooks/limeplay/use-player";
import { getDeviceLanguage, off, on } from "@/lib/utils";
import {
  useGetStore,
  useMediaStore,
} from "@/components/limeplay/media-provider";

export interface CaptionsStore {
  activeTextTrack: shaka.extern.TextTrack | null;
  textTracks?: shaka.extern.TextTrack[];
  textTrackVisible: boolean;
  textTrackContainerElement: HTMLDivElement | null;
  setTextTrackContainerElement: (ref: HTMLDivElement | null) => void;
}

export const createCaptionsStore: StateCreator<
  CaptionsStore & PlayerStore,
  [],
  [],
  CaptionsStore
> = (set) => ({
  activeTextTrack: null,
  textTracks: undefined,
  textTrackVisible: false,
  textTrackContainerElement: null,
  setTextTrackContainerElement: (element: HTMLDivElement | null) => {
    set({
      textTrackContainerElement: element,
    });
  },
});

export function useCaptionsStates() {
  const store = useGetStore();
  const player = useMediaStore((s) => s.player);
  const containerElement = useMediaStore((s) => s.textTrackContainerElement);
  const mediaRef = useMediaStore((state) => state.mediaRef);
  const canPlay = useMediaStore((state) => state.canPlay);

  const onTextTrackChanged = () => {
    if (!player) {
      return;
    }

    const activeTextTrack = player
      .getTextTracks()
      .find((t: shaka.extern.TextTrack) => t.active);

    store.setState({ activeTextTrack });
  };

  const onTracksChanged = () => {
    if (!player) {
      return;
    }

    const tracks = player.getTextTracks();
    store.setState({ textTracks: tracks });

    const activeTextTrack = tracks.find((t) => t.active);

    if (!activeTextTrack && tracks.length > 0) {
      const settings = JSON.parse(
        localStorage.getItem("realms-player") || "{}"
      );
      const autoSelectSubtitles = settings.autoSelectSubtitles ?? true;

      if (autoSelectSubtitles) {
        player.selectTextTrack(tracks[0]);
        player.setTextTrackVisibility(true);
      }
    }
  };

  const onTextTrackVisibility = () => {
    if (!player) {
      return;
    }

    const isVisible = player.isTextTrackVisible();

    store.setState({ textTrackVisible: isVisible });
  };

  useEffect(() => {
    if (!player || !containerElement) {
      return;
    }

    player.setVideoContainer(containerElement);
  }, [containerElement, player]);

  useEffect(() => {
    if (!mediaRef.current || !player) return;

    if (canPlay) {
      onTracksChanged();
    }

    on(player, "textchanged", onTextTrackChanged);
    on(player, ["trackschanged", "loading"], onTracksChanged);
    on(player, "texttrackvisibility", onTextTrackVisibility);

    return () => {
      off(player, "textchanged", onTextTrackChanged);
      off(player, ["trackschanged", "loading"], onTracksChanged);
      off(player, "texttrackvisibility", onTextTrackVisibility);
    };
  }, [mediaRef, player, canPlay]);
}

export function useCaptions() {
  const store = useGetStore();
  const player = useMediaStore((s) => s.player);
  const activeTextTrack = useMediaStore((s) => s.activeTextTrack);
  const textTracks = useMediaStore((s) => s.textTracks);

  const findDefaultTrack = useCallback(() => {
    if (!textTracks) {
      console.warn("No text tracks found");
      return;
    }

    if (textTracks.length === 1) {
      return textTracks[0];
    }

    const deviceLanguage = getDeviceLanguage();

    const regionalTrack = textTracks.find(
      (track) => track.language === deviceLanguage
    );

    if (regionalTrack) {
      return regionalTrack;
    }

    return textTracks[0];
  }, [textTracks]);

  const selectTrack = useCallback(
    (track: shaka.extern.TextTrack) => {
      if (!player || !textTracks) {
        return false;
      }

      player.selectTextTrack(track);
      player.setTextTrackVisibility(true);

      const activeTextTrack = player
        .getTextTracks()
        .find((t: shaka.extern.TextTrack) => t.active);

      store.setState({ activeTextTrack, textTrackVisible: true });

      return true;
    },
    [player, textTracks]
  );

  const toggleCaptionVisibility = () => {
    if (!player) {
      return;
    }

    if (!activeTextTrack) {
      const defaultTrack = findDefaultTrack();
      if (defaultTrack) {
        const isSuccess = selectTrack(defaultTrack);

        if (!isSuccess) {
          console.error("Failed to select default text track");
          return;
        }
      }
    }

    const isVisible = store.getState().textTrackVisible;
    player.setTextTrackVisibility(!isVisible);
  };

  return {
    toggleCaptionVisibility,
    selectTrack,
    activeTextTrack,
    textTracks,
  };
}
