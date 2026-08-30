import {
  isTauri,
  getCustomProviderFiles,
  saveCustomProviderFile,
  deleteCustomProviderFile,
} from "@/lib/tauri";

import { StreamProvider, ScrapeResult, Stream } from "./types";
import { providersConfig } from "./list";


export interface CustomProviderMeta {
  id: string;
  name: string;
  short: string;
  code: string;
  url?: string;
  enabled: boolean;
  version?: string;
  author?: string;
  description?: string;
  proxyRequired?: boolean;
  isCustom: true;
  lastTested?: {
    success: boolean;
    latencyMs: number;
    timestamp: number;
  };
}

const STORAGE_KEY = "anime-custom-providers";

// In-memory evaluated module cache
const loadedModules = new Map<string, StreamProvider>();

/**
 * Cleanly evaluates a JS module in the browser runtime via Blob URL
 */
export async function evaluateProviderCode(code: string): Promise<StreamProvider> {
  let blobUrl = "";
  try {
    // If the code uses CommonJS (module.exports = ...), convert or wrap it
    let modernCode = code;
    if (modernCode.includes("module.exports") && !modernCode.includes("export default")) {
      modernCode = `
        const module = { exports: {} };
        const exports = module.exports;
        ${code}
        export default module.exports.default || module.exports;
      `;
    }

    const blob = new Blob([modernCode], { type: "application/javascript" });
    blobUrl = URL.createObjectURL(blob);
    const mod = await import(/* webpackIgnore: true */ blobUrl);
    const providerInstance = mod.default || mod;

    if (!providerInstance || typeof providerInstance !== "object") {
      throw new Error("Provider script must export a default object with provider methods");
    }

    if (typeof providerInstance.scrape !== "function") {
      throw new Error("Provider must implement a 'scrape(id, config)' async function");
    }

    return providerInstance as StreamProvider;
  } finally {
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }
  }
}

/**
 * Retrieves all stored custom providers from localStorage and desktop filesystem
 */
export async function getCustomProviders(): Promise<CustomProviderMeta[]> {
  const localList: CustomProviderMeta[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        localList.push(...parsed);
      }
    }
  } catch (e) {
    console.error("[CustomProviders] Failed to parse localStorage custom providers", e);
  }

  // If running in Tauri desktop, sync with %APPDATA%/AnimeRealms/providers/
  if (isTauri()) {
    try {
      const diskFiles = await getCustomProviderFiles();

      for (const diskFile of diskFiles) {
        const id = `custom-${diskFile.name.toLowerCase().replace(/[^a-z0-9_-]/g, "")}`;
        const existing = localList.find((p) => p.id === id);
        if (!existing) {
          localList.push({
            id,
            name: diskFile.name,
            short: diskFile.name.toLowerCase().slice(0, 10),
            code: diskFile.code,
            enabled: true,
            isCustom: true,
          });
        } else if (existing.code !== diskFile.code) {
          existing.code = diskFile.code;
        }
      }
    } catch (e) {
      console.warn("[CustomProviders] Desktop disk sync skipped:", e);
    }
  }

  return localList;
}

/**
 * Saves or updates a custom provider in local storage and disk
 */
export async function saveCustomProvider(meta: Omit<CustomProviderMeta, "isCustom">): Promise<CustomProviderMeta> {
  const fullMeta: CustomProviderMeta = {
    ...meta,
    isCustom: true,
  };

  // Validate that the code parses and exports required methods
  await evaluateProviderCode(fullMeta.code);

  const list = await getCustomProviders();
  const index = list.findIndex((p) => p.id === fullMeta.id);
  if (index >= 0) {
    list[index] = fullMeta;
  } else {
    list.push(fullMeta);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

  // Sync to disk if desktop
  if (isTauri()) {
    try {
      await saveCustomProviderFile(
        `${fullMeta.name.toLowerCase().replace(/[^a-z0-9_-]/g, "")}.js`,
        fullMeta.code
      );
    } catch (e) {
      console.warn("[CustomProviders] Desktop disk write skipped:", e);
    }
  }

  // Register in runtime providersConfig
  providersConfig[fullMeta.id] = {
    name: fullMeta.name,
    short: fullMeta.short,
    proxyRequired: !!fullMeta.proxyRequired,
    isCustom: true,
  };

  return fullMeta;
}

/**
 * Deletes a custom provider
 */
export async function deleteCustomProvider(id: string): Promise<void> {
  const list = await getCustomProviders();
  const target = list.find((p) => p.id === id);
  const filtered = list.filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

  delete providersConfig[id];
  loadedModules.delete(id);

  if (isTauri() && target) {
    try {
      await deleteCustomProviderFile(
        `${target.name.toLowerCase().replace(/[^a-z0-9_-]/g, "")}.js`
      );
    } catch (e) {
      console.warn("[CustomProviders] Desktop disk delete skipped:", e);
    }
  }
}


/**
 * Installs a custom provider from a raw URL (e.g. GitHub raw / Gist)
 */
export async function installProviderFromUrl(rawUrl: string): Promise<CustomProviderMeta> {
  const res = await fetch(rawUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch provider script: HTTP ${res.status} ${res.statusText}`);
  }
  const code = await res.text();
  const parsed = await evaluateProviderCode(code);

  const name = parsed.name || "Custom Provider";
  const id = `custom-${name.toLowerCase().replace(/[^a-z0-9_-]/g, "")}`;

  return await saveCustomProvider({
    id,
    name,
    short: (parsed as any).short || name.toLowerCase().slice(0, 8),
    code,
    url: rawUrl,
    enabled: true,
    proxyRequired: !!parsed.proxyRequired,
  });
}

/**
 * Installs a custom provider from file content
 */
export async function installProviderFromCode(code: string, fileName?: string): Promise<CustomProviderMeta> {
  const parsed = await evaluateProviderCode(code);
  const fallbackName = fileName ? fileName.replace(/\.[^/.]+$/, "") : "Custom Provider";
  const name = parsed.name || fallbackName;
  const id = `custom-${name.toLowerCase().replace(/[^a-z0-9_-]/g, "")}`;

  return await saveCustomProvider({
    id,
    name,
    short: (parsed as any).short || name.toLowerCase().slice(0, 8),
    code,
    enabled: true,
    proxyRequired: !!parsed.proxyRequired,
  });
}

/**
 * Retrieves an evaluated runtime instance of a custom provider
 */
export async function getLoadedCustomProvider(id: string): Promise<StreamProvider | null> {
  if (loadedModules.has(id)) {
    return loadedModules.get(id)!;
  }

  const providers = await getCustomProviders();
  const target = providers.find((p) => p.id === id);
  if (!target || !target.enabled) {
    return null;
  }

  try {
    const instance = await evaluateProviderCode(target.code);
    loadedModules.set(id, instance);
    return instance;
  } catch (e) {
    console.error(`[CustomProviders] Failed to initialize custom provider ${id}:`, e);
    return null;
  }
}

export interface ProviderBenchmarkResult {
  success: boolean;
  latencyMs: number;
  animeId?: string;
  episodeCount?: number;
  streams?: Stream[];
  error?: string;
}

/**
 * Runs a benchmark test on any provider (custom or built-in)
 */
export async function benchmarkProvider(
  providerKey: string,
  anilistId: number = 21 // Default: One Piece
): Promise<ProviderBenchmarkResult> {
  const startTime = performance.now();

  try {
    if (providerKey.startsWith("custom-")) {
      const customInstance = await getLoadedCustomProvider(providerKey);
      if (!customInstance) {
        throw new Error("Custom provider module could not be loaded");
      }

      let targetId = "";
      if (typeof customInstance.map === "function") {
        targetId = await customInstance.map(anilistId);
      } else {
        targetId = String(anilistId);
      }

      if (!targetId) {
        return {
          success: false,
          latencyMs: Math.round(performance.now() - startTime),
          error: "Anime mapping returned empty result (not found on provider)",
        };
      }

      let episodeId = targetId;
      let episodeCount = 1;
      if (typeof customInstance.getEpisodes === "function") {
        const eps = await customInstance.getEpisodes(targetId);
        if (Array.isArray(eps) && eps.length > 0) {
          episodeId = eps[0].id || targetId;
          episodeCount = eps.length;
        }
      }

      const scrapeResult = await customInstance.scrape(episodeId);
      const latencyMs = Math.round(performance.now() - startTime);

      if (scrapeResult?.streams && scrapeResult.streams.length > 0) {
        return {
          success: true,
          latencyMs,
          animeId: targetId,
          episodeCount,
          streams: scrapeResult.streams,
        };
      }

      return {
        success: false,
        latencyMs,
        animeId: targetId,
        episodeCount,
        error: scrapeResult?.message || "No streams returned",
      };
    }

    // Built-in provider: test via /api/watch endpoint
    const res = await fetch("/api/watch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider: providerKey,
        anilistId,
        episodeNumber: 1,
      }),
    });

    const latencyMs = Math.round(performance.now() - startTime);
    const data = await res.json();

    if (data?.streams && data.streams.length > 0) {
      return {
        success: true,
        latencyMs,
        streams: data.streams,
      };
    }

    return {
      success: false,
      latencyMs,
      error: data?.message || data?.error ? "Scrape failed" : "No streams found",
    };
  } catch (err: any) {
    return {
      success: false,
      latencyMs: Math.round(performance.now() - startTime),
      error: err.message || String(err),
    };
  }
}
