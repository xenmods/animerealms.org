# animerealms

Open-source anime streaming web application built with Next.js and AniList integration.

## Requirements

- Node.js 18+ or Bun
- MongoDB database
- AniList Developer API client
- M3U8 CORS stream proxy

## Getting Started

1. Clone the repository and install dependencies:

```bash
git clone https://github.com/xenmods/animerealms.org.git
cd animerealms.org
bun install
```

2. Copy the sample environment file and configure your keys:

```bash
cp .env.sample .env
```

### Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection URI for user profiles, watch progress, and settings |
| `AUTH_SECRET` | Secret key used to encrypt session tokens (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Canonical base URL of the deployment (e.g. `http://localhost:3000`) |
| `ANILIST_ID` | AniList OAuth client ID from https://anilist.co/settings/developer |
| `ANILIST_SECRET` | AniList OAuth client secret |
| `NEXT_PUBLIC_PROXY_URL` | Base URL of your M3U8 CORS proxy instance (required for stream playback) |
| `TMDB_API_KEY` | (Optional) TMDB API key for title logos and metadata enrichment |

3. Run the development server:

```bash
bun dev
```

To build and start for production:

```bash
bun run build
bun start
```

## Providers

Streaming sources are modular and located in `lib/providers/anime/`.

- **Built-in Providers**: `anidb` (Sub), `anidb-dub` (Dub), `megaplay` (Sub), and `megaplay-dub` (Dub).
- **Adding Custom Providers**: See the [Provider Implementation Guide](lib/providers/README.md) for interface specifications and registration instructions.

## M3U8 Stream Proxy

Third-party video streams require CORS headers and custom Referer handling to play in modern browsers.

- Set `NEXT_PUBLIC_PROXY_URL` in your `.env` file to your deployed m3u8 reverse proxy.
- Users can also customize or override the proxy endpoint directly in the in-app player settings.

## Note and Disclaimer

The original site is no longer online or maintained. This repository is open to pull requests, but independent forks and self-hosting are encouraged.

The project authors and contributors assume no liability for the availability, content, or legality of any third-party streaming sources accessed through this software.
