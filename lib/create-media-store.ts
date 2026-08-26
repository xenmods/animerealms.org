import { create } from "zustand";

import {
  CaptionsStore,
  createCaptionsStore,
} from "@/hooks/limeplay/use-captions";
import {
  createPlayerRootStore,
  PlayerRootStore,
} from "@/hooks/limeplay/use-player-root-store";
import { createVolumeStore, VolumeStore } from "@/hooks/limeplay/use-volume";
import {
  createTimelineStore,
  TimelineStore,
} from "@/hooks/limeplay/use-timeline";
import {
  createMediaStateStore,
  MediaStateStore,
} from "@/hooks/limeplay/use-media-state";

export type TypeMediaStore = VolumeStore &
  CaptionsStore &
  TimelineStore &
  PlayerRootStore &
  MediaStateStore & {};

export interface CreateMediaStoreProps {
  debug?: boolean;
}

export function createMediaStore(initProps?: Partial<CreateMediaStoreProps>) {
  const mediaStore = create<TypeMediaStore>()((...etc) => ({
    ...createPlayerRootStore(...etc),
    ...createVolumeStore(...etc),
    ...createTimelineStore(...etc),
    ...createMediaStateStore(...etc),
    ...createCaptionsStore(...etc),
    ...initProps,
  }));
  return mediaStore;
}
