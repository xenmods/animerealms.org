/**
 * Desktop Tauri Bridge & Native Utilities for AnimeRealms
 */

export function isTauri(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(
    (window as any).__TAURI_INTERNALS__ ||
    (window as any).__TAURI__ ||
    (window as any).__TAURI_METADATA__ ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  );
}

export async function getTauriProxyUrl(): Promise<string> {
  return "http://127.0.0.1:39282";
}

export interface DiscordPresenceOptions {
  details?: string;
  state?: string;
  largeImage?: string;
  largeText?: string;
  smallImage?: string;
  smallText?: string;
  timeElapsed?: number;
  duration?: number;
  button1Label?: string;
  button1Url?: string;
  button2Label?: string;
  button2Url?: string;
  animeTitle?: string;
  episode?: number;
  coverImage?: string;
}

export async function setDiscordPresence(options: DiscordPresenceOptions): Promise<void> {
  if (!isTauri()) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const details =
      options.details ||
      (options.animeTitle ? `Watching ${options.animeTitle}` : "Browsing Anime");
    const stateText =
      options.state ||
      (options.episode ? `Episode ${options.episode}` : "AnimeRealms Desktop");
    const largeImage =
      options.largeImage ||
      options.coverImage ||
      "https://raw.githubusercontent.com/xenmods/animerealms.org/main/public/traced-logo.png";
    const largeText = options.largeText || options.animeTitle || "AnimeRealms";

    await invoke("set_discord_presence", {
      details,
      stateText,
      largeImage,
      largeText,
      smallImage: options.smallImage || null,
      smallText: options.smallText || null,
      timeElapsed: options.timeElapsed ? Math.floor(options.timeElapsed) : null,
      duration: options.duration ? Math.floor(options.duration) : null,
      button1Label: options.button1Label || "AnimeRealms GitHub",
      button1Url: options.button1Url || "https://github.com/xenmods/animerealms.org",
      button2Label: options.button2Label || null,
      button2Url: options.button2Url || null,
    });
  } catch (e) {
    console.warn("[Tauri] Failed to set Discord presence:", e);
  }
}

export async function clearDiscordPresence(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("clear_discord_presence");
  } catch (e) {
    console.warn("[Tauri] Failed to clear Discord presence:", e);
  }
}

export async function minimizeWindow(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().minimize();
  } catch (e) {
    console.warn("[Tauri] Failed to minimize window:", e);
  }
}

export async function toggleMaximizeWindow(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().toggleMaximize();
  } catch (e) {
    console.warn("[Tauri] Failed to toggle maximize:", e);
  }
}

export async function closeWindow(): Promise<void> {
  if (!isTauri()) return;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().close();
  } catch (e) {
    console.warn("[Tauri] Failed to close window:", e);
  }
}

export async function sendDesktopNotification(
  title: string,
  body: string
): Promise<void> {
  if (!isTauri()) return;
  try {
    const { isPermissionGranted, requestPermission, sendNotification } =
      await import("@tauri-apps/plugin-notification");
    let granted = await isPermissionGranted();
    if (!granted) {
      const permission = await requestPermission();
      granted = permission === "granted";
    }
    if (granted) {
      sendNotification({ title, body });
    }
  } catch (e) {
    console.warn("[Tauri] Failed to send notification:", e);
  }
}

export async function openInBrowser(url: string): Promise<void> {
  if (isTauri()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_in_browser", { url });
      return;
    } catch (e) {
      console.warn("[Tauri] Failed to open in external browser via invoke:", e);
    }
  }
  if (typeof window !== "undefined") {
    window.open(url, "_blank");
  }
}

export async function isWindowFullscreen(): Promise<boolean> {
  if (!isTauri()) return Boolean(document.fullscreenElement);
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    return await getCurrentWindow().isFullscreen();
  } catch (e) {
    return Boolean(document.fullscreenElement);
  }
}

export async function setFullscreenWindow(fullscreen: boolean): Promise<void> {
  if (isTauri()) {
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setFullscreen(fullscreen);
      return;
    } catch (e) {
      console.warn("[Tauri] Failed to set window fullscreen:", e);
    }
  }
  if (fullscreen) {
    if (document.documentElement.requestFullscreen) {
      await document.documentElement.requestFullscreen();
    }
  } else {
    if (document.exitFullscreen && document.fullscreenElement) {
      await document.exitFullscreen();
    }
  }
}

export async function toggleFullscreenWindow(): Promise<boolean> {
  const current = await isWindowFullscreen();
  await setFullscreenWindow(!current);
  return !current;
}

export interface DownloadedFile {
  filename: string;
  path: string;
  size_bytes: number;
  formatted_size: string;
  modified: number;
  anime_title: string;
  episode: number;
}

export interface DownloadProgressEvent {
  anime_title: string;
  episode: number;
  current: number;
  total: number;
  percent: number;
  status: string;
}

export async function startEpisodeDownload(options: {
  streamUrl: string;
  animeTitle: string;
  episodeNumber: number;
  quality?: string;
  referer?: string;
}): Promise<string> {
  try {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const { invoke } = await import("@tauri-apps/api/core");
      return await invoke<string>("start_episode_download", {
        streamUrl: options.streamUrl,
        animeTitle: options.animeTitle,
        episodeNumber: options.episodeNumber,
        quality: options.quality || null,
        referer: options.referer || null,
      });
    }
  } catch (e) {
    console.warn("[Tauri IPC] Falling back to proxy download:", e);
  }

  // Fallback to proxy download endpoint if available or error
  return "";
}

export async function openDownloadsFolder(): Promise<void> {
  try {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_downloads_folder");
      return;
    }
  } catch (e) {
    console.warn("[Tauri IPC] Fallback to REST open_downloads:", e);
  }

  try {
    await fetch("http://127.0.0.1:39282/api/downloads/open", { method: "POST" });
  } catch (err) {
    console.warn("[REST] Failed to open downloads folder:", err);
  }
}

export async function getDownloadedFiles(): Promise<DownloadedFile[]> {
  try {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const { invoke } = await import("@tauri-apps/api/core");
      const list = await invoke<DownloadedFile[]>("get_downloaded_files");
      if (list && Array.isArray(list)) return list;
    }
  } catch (e) {
    console.warn("[Tauri IPC] Fallback to REST get_downloaded_files:", e);
  }

  try {
    const res = await fetch("http://127.0.0.1:39282/api/downloads/list");
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[REST] Failed to get downloaded files:", err);
  }
  return [];
}

export async function deleteDownloadedFile(filePath: string): Promise<void> {
  try {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("delete_downloaded_file", { filePath });
      return;
    }
  } catch (e) {
    console.warn("[Tauri IPC] Fallback to REST delete_downloaded_file:", e);
  }

  try {
    await fetch(`http://127.0.0.1:39282/api/downloads/delete?path=${encodeURIComponent(filePath)}`, {
      method: "POST",
    });
  } catch (err) {
    console.warn("[REST] Failed to delete downloaded file:", err);
  }
}

export async function playDownloadedFile(filePath: string): Promise<void> {
  try {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("play_downloaded_file", { filePath });
      return;
    }
  } catch (e) {
    console.warn("[Tauri IPC] Fallback to REST play_downloaded_file:", e);
  }

  try {
    await fetch(`http://127.0.0.1:39282/api/downloads/play?path=${encodeURIComponent(filePath)}`, {
      method: "POST",
    });
  } catch (err) {
    console.warn("[REST] Failed to play downloaded file:", err);
  }
}

export async function openProvidersFolder(): Promise<void> {
  try {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("open_providers_folder");
      return;
    }
  } catch (e) {
    console.warn("[Tauri IPC] Fallback to REST open_providers_folder:", e);
  }

  try {
    await fetch("http://127.0.0.1:39282/api/providers/open", { method: "POST" });
  } catch (err) {
    console.warn("[REST] Failed to open providers folder:", err);
  }
}

export async function getCustomProviderFiles(): Promise<
  Array<{ filename: string; name: string; code: string; modified: number }>
> {
  try {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const { invoke } = await import("@tauri-apps/api/core");
      const list = await invoke<
        Array<{ filename: string; name: string; code: string; modified: number }>
      >("get_custom_provider_files");
      if (list && Array.isArray(list)) return list;
    }
  } catch (e) {
    console.warn("[Tauri IPC] Fallback to REST get_custom_provider_files:", e);
  }

  try {
    const res = await fetch("http://127.0.0.1:39282/api/providers/list");
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("[REST] Failed to get custom provider files:", err);
  }
  return [];
}

export async function saveCustomProviderFile(
  filename: string,
  code: string
): Promise<void> {
  try {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("save_custom_provider_file", { filename, code });
      return;
    }
  } catch (e) {
    console.warn("[Tauri IPC] Fallback to REST save_custom_provider_file:", e);
  }

  try {
    await fetch("http://127.0.0.1:39282/api/providers/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename, code }),
    });
  } catch (err) {
    console.warn("[REST] Failed to save custom provider file:", err);
  }
}

export async function deleteCustomProviderFile(filename: string): Promise<void> {
  try {
    if (typeof window !== "undefined" && (window as any).__TAURI_INTERNALS__) {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("delete_custom_provider_file", { filename });
      return;
    }
  } catch (e) {
    console.warn("[Tauri IPC] Fallback to REST delete_custom_provider_file:", e);
  }

  try {
    await fetch("http://127.0.0.1:39282/api/providers/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
  } catch (err) {
    console.warn("[REST] Failed to delete custom provider file:", err);
  }
}

export async function onDownloadProgress(
  callback: (event: DownloadProgressEvent) => void
): Promise<() => void> {
  if (!isTauri()) return () => {};
  try {
    const { listen } = await import("@tauri-apps/api/event");
    const unlisten = await listen<DownloadProgressEvent>("download-progress", (ev) => {
      callback(ev.payload);
    });
    return unlisten;
  } catch (e) {
    console.warn("[Tauri] Failed to listen to download-progress:", e);
    return () => {};
  }
}





