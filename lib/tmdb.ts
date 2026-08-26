import FuzzySet from "fuzzyset";
import clientPromise from "@/lib/db";

const TMDB_API_KEY = process.env.TMDB_API_KEY || "";

const ANILIST_API_URL = "https://graphql.anilist.co";
const TMDB_API_URL = "https://api.themoviedb.org/3";
const ANIZIP_API_URL = "https://api.ani.zip/mappings";

async function getAniZipData(anilistId: any) {
  const url = `${ANIZIP_API_URL}?anilist_id=${anilistId}`;
  console.log(`Fetching data from AniZip for ID: ${anilistId}...`);
  try {
    const response = await fetch(url);
    if (response.status === 404) {
      console.log(` > No data found on AniZip for anilistId: ${anilistId}`);
      return null;
    }
    if (!response.ok) {
      throw new Error(`AniZip API responded with status: ${response.status}`);
    }
    const data = await response.json();
    if (data && data.episodes && Object.keys(data.episodes).length > 0) {
      console.log(` > Successfully found data on AniZip.`);
      return data;
    }
    console.log(
      ` > AniZip data for ${anilistId} is incomplete or has no episodes.`
    );
    return null;
  } catch (error: any) {
    console.error(` > Error connecting to AniZip API: ${error.message}`);
    return null;
  }
}

function parseSeasonNumber(title: string) {
  const match = title.match(
    /(?:season\s|S)(\d+)|(\d+)(?:st|nd|rd|th)\sseason/i
  );
  if (match) {
    return parseInt(match[1] || match[2], 10);
  }
  return null;
}

function cleanTitleForSearch(title: string) {
  return title
    .replace(/(?:\s-\s)?(TV|ONA|OVA)$/i, "")
    .replace(
      /(?::\s|\s-\s)?(season\s\d+|S\d+|\d+(?:st|nd|rd|th)\sseason|cour\s\d+)/i,
      ""
    )
    .trim()
    .toLowerCase();
}

async function getAnilistInfo(anilistId: any) {
  const query = `
    query ($id: Int) {
      Media (id: $id, type: ANIME) {
        id
        title {
          romaji
          english
          native
        }
        description
        startDate {
          year
          month
          day
        }
        coverImage {
          extraLarge
          large
        }
        format
        status
        episodes
      }
    }
    `;
  const variables = { id: anilistId };

  console.log(`Fetching data from AniList for ID: ${anilistId}...`);
  try {
    const response = await fetch(ANILIST_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`AniList API responded with status: ${response.status}`);
    }

    const data = await response.json();
    if (data.errors) {
      console.error(`  > AniList API Error: ${JSON.stringify(data.errors)}`);
      return null;
    }
    return data.data.Media;
  } catch (error: any) {
    console.error(`  > Error connecting to AniList API: ${error.message}`);
    return null;
  }
}

async function searchTmdbForShow(title: string, year: any, type: string) {
  if (!TMDB_API_KEY || TMDB_API_KEY === "YOUR_TMDB_API_KEY_HERE") {
    console.error(
      "  > ERROR: TMDB_API_KEY is not set. Please configure it at the top of the script."
    );
    return null;
  }

  const searchUrl = new URL(`${TMDB_API_URL}/search/${type}`);
  searchUrl.searchParams.append("api_key", TMDB_API_KEY);
  searchUrl.searchParams.append("query", title.toLowerCase());
  if (year) {
    searchUrl.searchParams.append("first_air_date_year", year);
  }

  console.log(
    `Searching TMDB for '${title.toLowerCase()}' (Year: ${year || "any"})...`
  );
  try {
    const response = await fetch(searchUrl);
    if (!response.ok) {
      throw new Error(`TMDB API responded with status: ${response.status}`);
    }
    const data = await response.json();
    const results = data.results || [];

    if (results.length === 0) {
      console.log(`  > No results found on TMDB for '${title}'.`);
      return null;
    }

    console.log(
      `  > Found ${results.length} match(es). Getting the best result...`
    );

    const fuzzySet = new FuzzySet();
    results.forEach((result) => {
      let name = type === "movie" ? result.title : result.name;
      if (name) fuzzySet.add(name);
    });

    const fuzzyResult = fuzzySet.get(title);
    if (!fuzzyResult || fuzzyResult.length === 0) {
      console.log(
        `  > Fuzzy match failed. Using first result: ${
          results[0].name || results[0].title
        }`
      );
      return results[0];
    }

    let bestMatchTitle = fuzzyResult[0][1];
    let bestMatch = results.find((result) => {
      if (type === "movie") return result.title === bestMatchTitle;
      return result.name === bestMatchTitle;
    });

    if (bestMatch) {
      console.log(`  > Best match: ${bestMatch.name || bestMatch.title}`);
      return bestMatch;
    } else {
      console.log(
        `  > No best match found. Using First Result: ${
          results[0].name || results[0].title
        }`
      );
      return results[0];
    }
  } catch (error: any) {
    console.error(`  > Error connecting to TMDB API: ${error.message}`);
    return null;
  }
}

async function getTmdbShow(id: any, type: any) {
  const showUrl = `${TMDB_API_URL}/${type}/${id}?api_key=${TMDB_API_KEY}`;

  console.log(`Fetching TMDB show details for ID: ${id}...`);
  try {
    const response = await fetch(showUrl);
    if (!response.ok) {
      return null;
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error(`  > Error fetching show details: ${error.message}`);
    return null;
  }
}

async function getTmdbEpisodeGroups(tvId: any) {
  const groupsUrl = `${TMDB_API_URL}/tv/${tvId}/episode_groups?api_key=${TMDB_API_KEY}`;

  console.log(`Fetching episode groups for TMDB ID: ${tvId}...`);
  try {
    const response = await fetch(groupsUrl);
    if (!response.ok) {
      throw new Error(`TMDB API responded with status: ${response.status}`);
    }
    const data = await response.json();
    return data.results || [];
  } catch (error: any) {
    console.error(`  > Could not fetch episode groups: ${error.message}`);
    return [];
  }
}

async function getEpisodesFromGroup(groupId: any) {
  const groupDetailsUrl = `${TMDB_API_URL}/tv/episode_group/${groupId}?api_key=${TMDB_API_KEY}`;

  console.log(`Fetching episodes from group ID: ${groupId}...`);
  try {
    const response = await fetch(groupDetailsUrl);
    if (!response.ok) {
      throw new Error(`TMDB API responded with status: ${response.status}`);
    }
    const data = await response.json();

    let allEpisodes = [];
    for (const seasonGroup of data.groups || []) {
      allEpisodes.push(...(seasonGroup.episodes || []));
    }

    allEpisodes.sort((a, b) => a.episode_number - b.episode_number);
    return allEpisodes;
  } catch (error: any) {
    console.error(`  > Could not fetch episodes from group: ${error.message}`);
    return [];
  }
}

async function getEpisodesForSpecificSeason(tvId: any, seasonNumber: any) {
  console.log(
    `  > Fetching episodes specifically for Season ${seasonNumber}...`
  );
  const seasonUrl = `${TMDB_API_URL}/tv/${tvId}/season/${seasonNumber}?api_key=${TMDB_API_KEY}`;
  try {
    const response = await fetch(seasonUrl);
    if (!response.ok) {
      if (response.status === 404) {
        console.log(
          `    > Season ${seasonNumber} not found on TMDB for this show.`
        );
        return [];
      }
      throw new Error(`TMDB API responded with status: ${response.status}`);
    }
    const seasonData = await response.json();
    return seasonData.episodes || [];
  } catch (error: any) {
    console.error(
      `  > Error fetching season ${seasonNumber}: ${error.message}`
    );
    return [];
  }
}

async function getEpisodesSeasonBySeason(tvId: any, requiredCount: any) {
  console.log(`  > Fetching episodes sequentially...`);
  let allEpisodes = [];
  try {
    const showDetailsUrl = `${TMDB_API_URL}/tv/${tvId}?api_key=${TMDB_API_KEY}`;
    const showResponse = await fetch(showDetailsUrl);
    if (!showResponse.ok)
      throw new Error(`TMDB API responded with status: ${showResponse.status}`);
    const showData = await showResponse.json();

    const seasons = showData.seasons
      .filter((s) => s.season_number > 0)
      .sort((a, b) => a.season_number - b.season_number);

    for (const season of seasons) {
      console.log(`    > Fetching Season ${season.season_number}...`);
      const seasonUrl = `${TMDB_API_URL}/tv/${tvId}/season/${season.season_number}?api_key=${TMDB_API_KEY}`;
      const seasonResponse = await fetch(seasonUrl);
      const seasonData = await seasonResponse.json();

      if (seasonData.episodes) {
        allEpisodes.push(...seasonData.episodes);
      }

      if (allEpisodes.length >= requiredCount) {
        break;
      }
    }

    allEpisodes.sort((a, b) => {
      if (a.season_number !== b.season_number)
        return a.season_number - b.season_number;
      return a.episode_number - b.episode_number;
    });

    return allEpisodes;
  } catch (error: any) {
    console.error(`  > Error during season-by-season fetch: ${error.message}`);
    return [];
  }
}

export async function fetchEpisodesAnilist(anilistId: any) {
  console.log("-".repeat(50));

  // 0. check db cache
  const client = await clientPromise;
  const db = client.db("animerealms_v2");
  const episodesCollection = db.collection("episodes");
  const ep_document = await episodesCollection.findOne({
    anilistId: anilistId,
  });

  if (ep_document) {
    if (ep_document.anilist) {
      return ep_document.anilist;
    }
  }

  const aniZipData = await getAniZipData(anilistId);
  const anilistData = await getAnilistInfo(anilistId);
  if (!anilistData) return [];

  if (aniZipData) {
    console.log("> Using AniZip data to build episode list...");

    let episodes = Object.values(aniZipData.episodes).map((ep) => ({
      episode_number: ep.episodeNumber || parseFloat(ep.episode),
      season_number: ep.seasonNumber,
      name:
        ep.title?.en || ep.title?.["x-jat"] || `Episode ${ep.episodeNumber}`,
      still_path: ep?.image,
      overview: ep.overview || ep.summary || "No Description",
      air_date: ep.airdate,
    }));

    console.log(`> Found ${episodes.length} episodes from AniZip.`);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log(`Today's date: ${today}`);
    episodes = episodes.filter((episode) => {
      if (!episode.air_date) return false;
      if (!episode.episode_number) return false;
      const airDate = new Date(episode.air_date);
      console.log(`Episode ${episode.episode_number} airdate: ${airDate}`);
      return airDate <= today;
    });

    console.log(`> Filtered out ${episodes.length} un-aired episodes.`);

    episodes = episodes.map((ep, index) => ({
      ...ep,
      episode_number: index + 1,
    }));

    if (episodes && episodes.length > 0) {
      console.log(
        "\n--- SUCCESSFULLY FETCHED EPISODE METADATA (via AniZip) ---"
      );
    } else {
      console.log("\n--- FAILED to fetch episodes from AniZip. ---");
      return [];
    }

    const toAdd = { anilistId: anilistId, anilist: episodes };
    if (anilistData.status !== "FINISHED") toAdd.cachedAt = new Date();
    await episodesCollection.updateOne(
      { anilistId: anilistId },
      { $set: toAdd },
      { upsert: true }
    );
    return episodes;
  }

  console.log("> AniZip data not found. Falling back to TMDB search logic.");

  const titleToSearch = anilistData.title.english || anilistData.title.romaji;
  const romajiTitle = anilistData.title.romaji;
  const startDate = anilistData.startDate;
  const anilistEpisodeCount = anilistData.episodes;
  const type = anilistData.format === "MOVIE" ? "movie" : "tv";

  console.log(`  > AniList reports ${anilistEpisodeCount} main episodes.`);

  // Search TMDB for the show, with fallbacks but first check in DB
  const mappingsCollection = db.collection("mappings");
  const document = await mappingsCollection.findOne({
    anilistId: anilistId,
  });

  let tmdbShow;
  if (document && document.tmdbId) {
    tmdbShow = await getTmdbShow(document.tmdbId, type);
  } else {
    tmdbShow = await searchTmdbForShow(titleToSearch, startDate?.year, type);
  }

  if (!tmdbShow) {
    console.log("--- Primary Search Failed, Trying Fallbacks Without Year ---");
    const cleanedTitle = cleanTitleForSearch(titleToSearch);
    if (cleanedTitle.toLowerCase() !== titleToSearch.toLowerCase()) {
      tmdbShow = await searchTmdbForShow(cleanedTitle, null, type);
    }
    if (
      !tmdbShow &&
      romajiTitle.toLowerCase() !== titleToSearch.toLowerCase()
    ) {
      tmdbShow = await searchTmdbForShow(romajiTitle, null, type);
    }
    const cleanedRomaji = cleanTitleForSearch(romajiTitle);
    if (
      !tmdbShow &&
      cleanedRomaji.toLowerCase() !== romajiTitle.toLowerCase() &&
      cleanedRomaji.toLowerCase() !== cleanedTitle.toLowerCase()
    ) {
      tmdbShow = await searchTmdbForShow(cleanedRomaji, null, type);
    }
  }

  if (!tmdbShow) {
    console.log(
      "\n--- FAILED to find a match on TMDB after all fallbacks. ---"
    );
    // in this case, we will make a list of episodes from the anilist information.
    // that is, 1 to the number of episodes with titles as Episode 1 blah blah and description as No Description
    // images can be the anime cover
    const episodes = [];
    for (let i = 1; i <= anilistEpisodeCount; i++) {
      episodes.push({
        episode_number: i,
        season_number: 1,
        name: `Episode ${i}`,
        still_path: anilistData.coverImage?.extraLarge
          ? anilistData.coverImage.extraLarge
          : null,
        overview: "No Description",
        air_date: null,
      });
    }
    const toAdd = { anilistId: anilistId, anilist: episodes };
    if (anilistData.status !== "FINISHED") {
      toAdd.cachedAt = new Date();
    }
    await episodesCollection.updateOne(
      { anilistId: anilistId },
      { $set: toAdd },
      { upsert: true }
    );
    return episodes;
  }

  // Set mapping in DB
  if (!document) {
    await mappingsCollection.insertOne({
      anilistId: anilistId,
      tmdbId: tmdbShow.id,
      cachedAt: new Date(),
    });
  }

  if (type === "movie") {
    const movieEpisodeData = {
      episode_number: 1,
      season_number: 1,
      name: "Full Movie",
      still_path: tmdbShow.backdrop_path
        ? `https://image.tmdb.org/t/p/original${tmdbShow.backdrop_path}`
        : null,
      overview: anilistData.description,
      air_date: tmdbShow.release_date,
    };

    const episodes = [movieEpisodeData];

    console.log("\n--- SUCCESSFULLY FETCHED MOVIE METADATA (via TMDB) ---");

    const toAdd = { anilistId: anilistId, anilist: episodes };
    if (anilistData.status !== "FINISHED") {
      toAdd.cachedAt = new Date();
    }
    await episodesCollection.updateOne(
      { anilistId: anilistId },
      { $set: toAdd },
      { upsert: true }
    );
    return episodes;
  }

  const tmdbTvId = tmdbShow.id;
  let episodes = [];

  const targetSeason =
    parseSeasonNumber(titleToSearch) || parseSeasonNumber(romajiTitle);

  if (targetSeason) {
    console.log(`  > Detected request for Season ${targetSeason}.`);
    episodes = await getEpisodesForSpecificSeason(tmdbTvId, targetSeason);

    if (
      (!episodes || episodes.length === 0) &&
      startDate?.year &&
      startDate?.month
    ) {
      console.log(
        `  > Specific season not found. Assuming a combined season on TMDB. Searching by air date...`
      );
      const allEpisodes = await getEpisodesSeasonBySeason(tmdbTvId, 999);
      if (allEpisodes.length > 0) {
        const seasonStartDate = new Date(
          Date.UTC(startDate.year, startDate.month - 1, 1)
        );
        const startIndex = allEpisodes.findIndex((ep) => {
          if (!ep.air_date) return false;
          const epAirDate = new Date(ep.air_date);
          return epAirDate >= seasonStartDate;
        });
        if (startIndex !== -1) {
          console.log(`  > Found season start at index ${startIndex}`);
          const endIndex = startIndex + anilistEpisodeCount;
          episodes = allEpisodes.slice(startIndex, endIndex);
          episodes = episodes.map((episode, index) => ({
            ...episode,
            episode_number: index + 1,
          }));
        }
      }
    }
  } else {
    const episodeGroups = await getTmdbEpisodeGroups(tmdbTvId);
    let targetGroup = null;
    if (episodeGroups) {
      const exactMatchGroup = episodeGroups.find(
        (g) => g.episode_count === anilistEpisodeCount
      );
      const absoluteGroup = episodeGroups.find((g) =>
        g.name.toLowerCase().includes("absolute")
      );
      if (exactMatchGroup) {
        console.log(
          `  > Found group '${exactMatchGroup.name}' with exact count. Using it.`
        );
        targetGroup = exactMatchGroup;
      } else if (absoluteGroup) {
        console.log("  > Found 'Absolute' order group. Using it.");
        targetGroup = absoluteGroup;
      }
    }
    if (targetGroup) {
      episodes = await getEpisodesFromGroup(targetGroup.id);
    } else {
      episodes = await getEpisodesSeasonBySeason(tmdbTvId, anilistEpisodeCount);
    }
  }

  if (
    episodes &&
    episodes.length > 0 &&
    anilistEpisodeCount &&
    episodes.length > anilistEpisodeCount
  ) {
    console.log(
      `  > VERIFICATION: Fetched ${episodes.length}, but AniList specifies ${anilistEpisodeCount}. Truncating.`
    );
    episodes = episodes.slice(0, anilistEpisodeCount);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  episodes = episodes.filter((episode) => {
    if (!episode.air_date) return false;
    const airDate = new Date(episode.air_date);
    return airDate <= today;
  });

  if (episodes && episodes.length > 0) {
    episodes = episodes.map((ep) => ({
      ...ep,
      still_path: ep.still_path
        ? `https://image.tmdb.org/t/p/original${ep.still_path}`
        : null,
    }));

    console.log("\n--- SUCCESSFULLY FETCHED EPISODE METADATA (via TMDB) ---");
    console.log(`Anime: ${titleToSearch}`);
    console.log(`Total Episodes Found: ${episodes.length}`);
    console.log("-".repeat(50));

    const toAdd = { anilistId: anilistId, anilist: episodes };
    if (anilistData.status !== "FINISHED") {
      toAdd.cachedAt = new Date();
    }
    await episodesCollection.updateOne(
      { anilistId: anilistId },
      { $set: toAdd },
      { upsert: true }
    );
    return episodes;
  } else {
    console.log("\n--- FAILED to fetch episodes via TMDB fallback. ---");
    return [];
  }
}

export async function getTitleLogo(anilistId: any, locale: string) {
  const anilistData = await getAnilistInfo(anilistId);
  if (!anilistData) return { logo: null, backdrop: null };

  const client = await clientPromise;
  const db = client.db("animerealms_v2");
  const mappingsCollection = db.collection("mappings");

  const document = await mappingsCollection.findOne({ anilistId: anilistId });
  if (
    document &&
    document.hasOwnProperty("logo") &&
    document.hasOwnProperty("backdrop")
  ) {
    console.log(`> Found logo and backdrop in DB for ${anilistId}.`);
    return { logo: document.logo, backdrop: document.backdrop };
  }

  const type = anilistData.format === "MOVIE" ? "movie" : "tv";
  let tmdbShow;
  let tmdbId = document?.tmdbId;

  if (!tmdbId) {
    console.log(`> No TMDB ID in DB for ${anilistId}. Trying to find one...`);
    const aniZipData = await getAniZipData(anilistId);
    if (aniZipData?.mappings?.themoviedb_id) {
      tmdbId = aniZipData.mappings.themoviedb_id;
      console.log(`> Found TMDB ID via AniZip: ${tmdbId}`);
    } else {
      console.log(
        "> AniZip mapping not found. Falling back to TMDB title search."
      );
      const titleToSearch =
        anilistData.title.english || anilistData.title.romaji;
      const romajiTitle = anilistData.title.romaji;
      const startDate = anilistData.startDate;

      let foundShow = await searchTmdbForShow(
        titleToSearch,
        startDate?.year,
        type
      );
      if (!foundShow) {
        const cleanedTitle = cleanTitleForSearch(titleToSearch);
        if (cleanedTitle !== titleToSearch) {
          foundShow = await searchTmdbForShow(cleanedTitle, null, type);
        }
      }
      if (!foundShow && romajiTitle !== titleToSearch) {
        foundShow = await searchTmdbForShow(romajiTitle, null, type);
      }
      if (!foundShow) {
        const cleanedRomaji = cleanTitleForSearch(romajiTitle);
        if (
          cleanedRomaji !== romajiTitle &&
          cleanedRomaji !== cleanTitleForSearch(titleToSearch)
        ) {
          foundShow = await searchTmdbForShow(cleanedRomaji, null, type);
        }
      }
      if (foundShow) {
        tmdbId = foundShow.id;
      }
    }

    if (tmdbId) {
      console.log(`> Saving new TMDB ID (${tmdbId}) to DB for ${anilistId}.`);
      await mappingsCollection.updateOne(
        { anilistId: anilistId },
        { $set: { tmdbId: tmdbId } },
        { upsert: true }
      );
    }
  }

  if (tmdbId) {
    tmdbShow = await getTmdbShow(tmdbId, type);
  }

  if (!tmdbShow) {
    console.log(
      "\n--- FAILED to find a match on TMDB after all fallbacks. ---"
    );
    await mappingsCollection.updateOne(
      { anilistId: anilistId },
      { $set: { logo: null, backdrop: null } },
      { upsert: true }
    );
    return { logo: null, backdrop: null };
  }

  const imagesUrl = `${TMDB_API_URL}/${type}/${tmdbShow.id}/images?api_key=${TMDB_API_KEY}`;
  const response = await fetch(imagesUrl);
  const data = await response.json();
  const logos = data.logos || [];
  const backdrops = data.backdrops || [];

  const backdropUrl =
    backdrops.length > 0
      ? `https://image.tmdb.org/t/p/original${backdrops[0].file_path}`
      : null;

  let logoUrl = null;
  const englishLogos = logos.filter((l) => l.iso_639_1 === "en");
  const sortedLogos = (englishLogos.length > 0 ? englishLogos : logos).sort(
    (a, b) => b.vote_average - a.vote_average
  );
  if (sortedLogos.length > 0) {
    logoUrl = `https://image.tmdb.org/t/p/original${sortedLogos[0].file_path}`;
  }

  console.log(`> Updating DB with logo/backdrop for ${anilistId}.`);
  await mappingsCollection.updateOne(
    { anilistId: anilistId },
    { $set: { logo: logoUrl, backdrop: backdropUrl } },
    { upsert: true }
  );

  return { logo: logoUrl, backdrop: backdropUrl };
}

export async function getTmdbId(anilistId: any) {
  const client = await clientPromise;
  const db = client.db("animerealms_v2");
  const mappingsCollection = db.collection("mappings");

  const document = await mappingsCollection.findOne({ anilistId: anilistId });
  if (document && document.tmdbId) {
    console.log(`> Found TMDB ID in DB for ${anilistId}: ${document.tmdbId}`);
    return document.tmdbId;
  }

  console.log(`> Resulting to resolution strategies for ${anilistId}...`);
  const anilistData = await getAnilistInfo(anilistId);
  if (!anilistData) return null;

  const type = anilistData.format === "MOVIE" ? "movie" : "tv";
  let tmdbId = null;

  const aniZipData = await getAniZipData(anilistId);
  if (aniZipData?.mappings?.themoviedb_id) {
    tmdbId = aniZipData.mappings.themoviedb_id;
    console.log(`> Found TMDB ID via AniZip: ${tmdbId}`);
  } else {
    console.log(
      "> AniZip mapping not found. Falling back to TMDB title search."
    );
    const titleToSearch = anilistData.title.english || anilistData.title.romaji;
    const romajiTitle = anilistData.title.romaji;
    const startDate = anilistData.startDate;

    let foundShow = await searchTmdbForShow(
      titleToSearch,
      startDate?.year,
      type
    );
    if (!foundShow) {
      const cleanedTitle = cleanTitleForSearch(titleToSearch);
      if (cleanedTitle !== titleToSearch) {
        foundShow = await searchTmdbForShow(cleanedTitle, null, type);
      }
    }
    if (!foundShow && romajiTitle !== titleToSearch) {
      foundShow = await searchTmdbForShow(romajiTitle, null, type);
    }
    if (!foundShow) {
      const cleanedRomaji = cleanTitleForSearch(romajiTitle);
      if (
        cleanedRomaji !== romajiTitle &&
        cleanedRomaji !== cleanTitleForSearch(titleToSearch)
      ) {
        foundShow = await searchTmdbForShow(cleanedRomaji, null, type);
      }
    }
    if (foundShow) {
      tmdbId = foundShow.id;
    }
  }

  if (tmdbId) {
    console.log(`> Saving new TMDB ID (${tmdbId}) to DB for ${anilistId}.`);
    await mappingsCollection.updateOne(
      { anilistId: anilistId },
      { $set: { tmdbId: tmdbId } },
      { upsert: true }
    );
    return tmdbId;
  }

  console.log(`> FAILED to resolve TMDB ID for ${anilistId}.`);
  return null;
}
