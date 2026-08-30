<div align="center">
  <img src="public/traced-logo.png" alt="Anime Realms Logo" width="120" />
  <h1>Anime Realms Desktop</h1>
  <p><strong>A modern, high-performance, self-contained desktop application for anime streaming, tracking, and offline downloads.</strong></p>

  <p>
    <a href="https://github.com/xenmods/animerealms.org/releases">
      <img src="https://img.shields.io/github/v/release/xenmods/animerealms.org?color=rose&style=for-the-badge" alt="Release" />
    </a>
    <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-e11d48?style=for-the-badge" alt="Platform" />
    <img src="https://img.shields.io/badge/Stack-Tauri%20v2%20%2B%20Next.js%2016-black?style=for-the-badge" alt="Stack" />
    <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License" />
  </p>
</div>

---

## ✨ Features

- **🚀 100% Self-Contained**: Single `.exe` installer on Windows and `.AppImage` / `.deb` on Linux. Bundles the Next.js server, Node runtime, and Rust proxy engine inside with zero prerequisite installs.
- **📥 Native Offline HLS Downloader**: Download episodes directly in high quality with multi-threaded segment fetching, automatic retries, and fast MP4 remuxing.
- **🎮 Discord Rich Presence (RPC)**: Automatically displays your currently watched anime title, episode number, elapsed time, and cover art on Discord.
- **🔌 Extensible Custom JS/TS Providers**: Drop custom provider scripts into your providers directory (`%APPDATA%/AnimeRealms/providers` or `~/.animerealms/providers/`) or install them directly via URL.
- **⚡ Built-in High-Speed Local Proxy**: Zero-latency, CORS-bypass local Axum streaming proxy on port `39282`.
- **🎨 Rich Metadata & TMDB Logos**: High-resolution anime logos, backdrops, episode thumbnails, and AniList synchronization.
- **🖼️ Sleek Borderless UI**: Custom titlebar, fluid animations, responsive video player, and dark mode design.

---

## 📥 Installation & Downloads

Pre-built releases for Windows and Linux are available under [**Releases**](https://github.com/xenmods/animerealms.org/releases).

### Windows
1. Download **`AnimeRealms-Setup.exe`**.
2. Run the installer and launch **Anime Realms**.

### Linux
1. Download **`AnimeRealms.AppImage`** or **`AnimeRealms_amd64.deb`**.
2. Make executable and run:
   ```bash
   chmod +x AnimeRealms.AppImage
   ./AnimeRealms.AppImage
   ```

---

## 🛠️ Developer Setup & Building from Source

### Prerequisites

- [Bun](https://bun.sh/) (or Node.js 18+)
- [Rust](https://rustup.rs/) (Cargo toolchain)
- **Windows**: [Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/) & WebView2
- **Linux** (Ubuntu/Debian):
  ```bash
  sudo apt update && sudo apt install -y \
    libwebkit2gtk-4.1-dev \
    build-essential \
    curl \
    wget \
    file \
    libxdo-dev \
    libssl-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev
  ```

---

### Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/xenmods/animerealms.org.git
   cd animerealms.org
   bun install
   ```

2. **Run in Development Mode**:
   ```bash
   bun run tauri dev
   ```

3. **Build Standalone Installers**:
   - **Windows** (`.exe` NSIS installer):
     ```bash
     bun run tauri build
     ```
   - **Linux** (`.AppImage` & `.deb`):
     ```bash
     bun run tauri build --bundles appimage,deb
     ```

---

## 📂 Desktop Directories

| Platform | Downloads Folder | Custom Providers Folder |
|---|---|---|
| **Windows** | `%USERPROFILE%\Downloads\Anime Realms\` | `%APPDATA%\AnimeRealms\providers\` |
| **Linux** | `~/Downloads/Anime Realms/` | `~/.animerealms/providers/` |
| **macOS** | `~/Downloads/Anime Realms/` | `~/Library/Application Support/AnimeRealms/providers/` |

---

## 📜 Disclaimer

Anime Realms is an open-source educational project. The authors and contributors do not host, store, or distribute any media files. All metadata and stream links are fetched from public third-party sources and community APIs.

---

## 📄 License

MIT © [Anime Realms Contributors](https://github.com/xenmods/animerealms.org)
