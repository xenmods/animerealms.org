export type ShortcutAction =
  | "togglePlay"
  | "toggleMute"
  | "toggleFullscreen"
  | "seekForward"
  | "seekBackward"
  | "volumeUp"
  | "volumeDown"
  | "nextEpisode"
  | "prevEpisode"
  | "screenshot"
  | "skip85s"
  | "toggleComments";

export interface Shortcut {
  action: ShortcutAction;
  label: string;
  defaultKey: string;
}

export const shortcutConfig: Shortcut[] = [
  { action: "togglePlay", label: "Toggle Play/Pause", defaultKey: "Space" },
  { action: "toggleMute", label: "Mute/Unmute", defaultKey: "m" },
  { action: "toggleFullscreen", label: "Toggle Fullscreen", defaultKey: "f" },
  {
    action: "seekForward",
    label: "Seek Forward (10s)",
    defaultKey: "ArrowRight",
  },
  {
    action: "seekBackward",
    label: "Seek Backward (10s)",
    defaultKey: "ArrowLeft",
  },
  { action: "volumeUp", label: "Volume Up", defaultKey: "ArrowUp" },
  { action: "volumeDown", label: "Volume Down", defaultKey: "ArrowDown" },
  { action: "nextEpisode", label: "Next Episode", defaultKey: "n" },
  { action: "prevEpisode", label: "Previous Episode", defaultKey: "p" },
  { action: "screenshot", label: "Take Screenshot", defaultKey: "s" },
  { action: "skip85s", label: "Skip 85s", defaultKey: "Shift+Enter" },
  { action: "toggleComments", label: "Toggle Comments", defaultKey: "c" },
];

export const defaultShortcuts = shortcutConfig.reduce(
  (acc, shortcut) => {
    acc[shortcut.action] = shortcut.defaultKey;
    return acc;
  },
  {} as Record<ShortcutAction, string>,
);
