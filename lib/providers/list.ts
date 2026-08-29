export const providerNames = [
  "local-download",
  "anidb",
  "anidb-dub",
  "megaplay",
  "megaplay-dub",
];

export const providersConfig: Record<
  string,
  { name: string; short: string; proxyRequired: boolean; isLocal?: boolean; isCustom?: boolean; ref?: string }
> = {
  "local-download": {
    name: "Local Downloads",
    short: "local",
    proxyRequired: false,
    isLocal: true,
  },
  anidb: {
    name: "AniDB",
    short: "anidb",
    proxyRequired: true,
  },
  "anidb-dub": {
    name: "AniDB Dub",
    short: "anidb-dub",
    proxyRequired: true,
  },
  megaplay: {
    name: "MegaPlay",
    short: "megaplay",
    proxyRequired: true,
  },
  "megaplay-dub": {
    name: "MegaPlay Dub",
    short: "megaplay-dub",
    proxyRequired: true,
  },
};

