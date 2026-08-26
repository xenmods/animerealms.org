// components/realms-player/ThumbnailScraper.js
"use client";

import { useEffect, useRef } from "react";
import Hls from "hls.js";

// This function creates the smart queue for generating thumbnails progressively.
function makeQueue(layers) {
  const output = [0, 1];
  let segmentSize = 0.5;
  let lastSegmentAmount = 0;
  for (let layer = 0; layer < layers; layer += 1) {
    const segmentAmount = 1 / segmentSize - 1;
    for (let i = 0; i < segmentAmount - lastSegmentAmount; i += 1) {
      const offset = i * segmentSize * 2;
      output.push(offset + segmentSize);
    }
    lastSegmentAmount = segmentAmount;
    segmentSize /= 2;
  }
  return output;
}

// This class does the heavy lifting: creates a hidden video, seeks, and captures frames.
class ThumnbnailWorker {
  interrupted = false;
  videoEl = null;
  canvasEl = null;
  hls = null;
  generateThumbnails = true;
  cb;

  constructor(ops) {
    this.cb = ops.addImage;
    if (ops.generateThumbnails !== null) {
      this.generateThumbnails = ops.generateThumbnails;
    }
  }

  async loadCustomHls() {
    // Check if the custom script is already loaded to avoid loading it multiple times
    if (window.Hls && window.Hls.customBuild) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/hls.js"; // The path to your custom build
      script.async = true;

      script.onload = () => {
        console.log("Custom HLS.js build loaded successfully.");
        // We can add a property to distinguish it, for example:
        if (window.Hls) {
          window.Hls.customBuild = true;
        }
        resolve();
      };

      script.onerror = () => {
        console.error("Failed to load the custom HLS.js build.");
        reject(new Error("Custom HLS.js script failed to load."));
      };

      document.body.appendChild(script);
    });
  }

  async start(sourceUrl, provider) {
    let HlsConstructor;

    if (provider === "pahe") {
      console.log("Provider 'pahe' detected. Loading custom HLS.js build...");
      try {
        await this.loadCustomHls();
        HlsConstructor = window.Hls;
      } catch (error) {
        console.error(error);
        return;
      }
    } else {
      HlsConstructor = Hls;
    }

    if (!HlsConstructor || !HlsConstructor.isSupported()) {
      console.error("HLS.js is not supported or failed to load.");
      return;
    }

    const el = document.createElement("video");
    el.muted = true;
    const canvas = document.createElement("canvas");

    this.hls = new HlsConstructor();
    this.hls.attachMedia(el);
    this.hls.loadSource(sourceUrl);
    this.videoEl = el;
    this.canvasEl = canvas;

    this.begin().catch((err) =>
      console.error("Thumbnail generation failed:", err)
    );
  }

  destroy() {
    this.interrupted = true;
    this.hls?.detachMedia();
    this.hls?.destroy();
    this.videoEl = null;
    this.canvasEl = null;
    this.hls = null;
  }

  async initVideo() {
    if (!this.videoEl || !this.canvasEl) return;
    await new Promise((resolve, reject) => {
      this.videoEl.addEventListener("loadedmetadata", resolve);
      this.videoEl.addEventListener("error", reject);
    });
    if (!this.videoEl || !this.canvasEl) return;
    this.canvasEl.width = this.videoEl.videoWidth / 5;
    this.canvasEl.height = this.videoEl.videoHeight / 5;
  }

  async takeSnapshot(at) {
    if (!this.videoEl || !this.canvasEl) return;
    this.videoEl.currentTime = at;
    await new Promise((resolve) => {
      const onSeeked = () => {
        this.videoEl?.removeEventListener("seeked", onSeeked);
        resolve(null);
      };
      this.videoEl?.addEventListener("seeked", onSeeked);
    });
    if (!this.videoEl || !this.canvasEl) return;
    const ctx = this.canvasEl.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      this.videoEl,
      0,
      0,
      this.canvasEl.width,
      this.canvasEl.height
    );
    const imgUrl = this.canvasEl.toDataURL("image/jpeg");
    if (this.interrupted || imgUrl === "data:,") return;
    this.cb({ at, data: imgUrl });
  }

  async begin() {
    const vid = this.videoEl;
    if (!vid) return;
    await this.initVideo();

    const TARGET_INTERVAL_SECONDS = 40;
    const MAX_THUMBNAILS = 200;

    let actualInterval = TARGET_INTERVAL_SECONDS;

    const potentialThumbnails = Math.floor(
      vid.duration / TARGET_INTERVAL_SECONDS
    );
    if (potentialThumbnails > MAX_THUMBNAILS) {
      actualInterval = vid.duration / MAX_THUMBNAILS;
      console.log(
        `Video is long. Increasing thumbnail interval to ~${Math.round(
          actualInterval
        )}s to maintain performance.`
      );
    }

    console.log(`[THUMBNAIL GENERATOR] Starting thumbnail generation...`);
    // Loop through the video using the calculated interval.
    for (let time = 0; time < vid.duration; time += actualInterval) {
      if (this.interrupted) return;
      if (!this.generateThumbnails) return;
      await this.takeSnapshot(time);
    }
    console.log(`[THUMBNAIL GENERATOR] Thumbnail generation completed.`);
  }
}

// This is the React component that manages the worker.
export function ThumbnailScraper({
  source,
  provider,
  onThumbnailUpdate,
  generateThumbnails,
}) {
  const workerRef = useRef(null);

  useEffect(() => {
    // If there's no source, do nothing.
    if (!source) return; // Create and start a new worker.
    if (generateThumbnails === null) {
      console.log(
        "[ThumbnailScraper] WAITING: Thumbnail setting is still null."
      );
      return; // Do nothing and wait for the prop to change.
    }

    if (generateThumbnails === false) {
      console.log(
        "[ThumbnailScraper] NOT GENERATING: Thumbnail generation disabled by user setting."
      );
      // Do nothing, and the cleanup function (from a previous render) will
      // ensure any existing worker is destroyed.
      return;
    }
    const worker = new ThumnbnailWorker({
      addImage: ({ at, data }) => {
        // This callback updates the parent component's state.
        onThumbnailUpdate((prev) => ({
          ...prev,
          [Math.floor(at)]: data,
        }));
      },
      generateThumbnails: generateThumbnails,
    });
    workerRef.current = worker;
    async function startWorker() {
      await worker.start(source, provider);
    }
    startWorker();

    return () => {
      worker.destroy();
      workerRef.current = null;
    };
  }, [source, provider, onThumbnailUpdate]); // Rerun whenever the video source changes. // This is a headless component, it doesn't render anything.

  return null;
}
