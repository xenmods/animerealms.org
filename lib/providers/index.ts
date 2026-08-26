import anidb from "./anime/anidb";
import anidbDub from "./anime/anidb-dub";
import megaplay from "./anime/megaplay";
import megaplayDub from "./anime/megaplay-dub";
import { StreamProvider } from "./types";

const providers: StreamProvider[] = [
  anidb,
  anidbDub,
  megaplay,
  megaplayDub,
];

export default providers;
