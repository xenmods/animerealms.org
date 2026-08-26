const TRENDING_ANIME = `query ($page: Int = 1, $id: Int, $type: MediaType = ANIME, $isAdult: Boolean = false, $size: Int = 15, $sort: [MediaSort] = [TRENDING_DESC, POPULARITY_DESC]) { Page(page: $page, perPage: $size) { pageInfo { total perPage currentPage lastPage hasNextPage } media(id: $id, type: $type, isAdult: $isAdult, sort: $sort) { id idMal status(version: 2) title { userPreferred romaji english native } genres trailer { id site thumbnail } description format bannerImage coverImage{ extraLarge large medium color } episodes meanScore duration season seasonYear averageScore popularity isAdult nextAiringEpisode { airingAt timeUntilAiring episode }  } } }`;
const POPULAR_ANIME = `query ($page: Int = 1, $id: Int, $type: MediaType = ANIME, $isAdult: Boolean = false, $size: Int = 15, $sort: [MediaSort] = [POPULARITY_DESC]) { Page(page: $page, perPage: $size) { pageInfo { total perPage currentPage lastPage hasNextPage } media(id: $id, type: $type, isAdult: $isAdult, sort: $sort) { id idMal status(version: 2) title { userPreferred romaji english native } trailer { id site thumbnail } format genres bannerImage description coverImage { extraLarge large medium color } episodes meanScore duration season seasonYear averageScore popularity isAdult nextAiringEpisode { airingAt timeUntilAiring episode }  } } }`;

export async function fetchTrendingAnime() {
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: TRENDING_ANIME,
        variables: {
          page: 1,
          size: 30,
        },
      }),
    });

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    return json?.data?.Page?.media || [];
  } catch (error) {
    console.error("Error fetching trending anime:", error);
    return [];
  }
}

export async function fetchPopularAnime() {
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: POPULAR_ANIME,
        variables: {
          page: 1,
          size: 30,
        },
      }),
    });

    if (!res.ok) {
      return [];
    }

    const json = await res.json();
    return json?.data?.Page?.media || [];
  } catch (error) {
    console.error("Error fetching popular anime:", error);
    return [];
  }
}

export const getAnilistThisSeason = async () => {
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  let season = "";
  if (month >= 0 && month <= 2) {
    season = "WINTER";
  } else if (month >= 3 && month <= 5) {
    season = "SPRING";
  } else if (month >= 6 && month <= 8) {
    season = "SUMMER";
  } else if (month >= 9 && month <= 11) {
    season = "FALL";
  }
  try {
    const resAnilist = await fetch(`https://graphql.anilist.co`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
              query ($page: Int = 1, $id: Int, $type: MediaType, $isAdult: Boolean = false, $search: String, $format: [MediaFormat], $status: MediaStatus, $countryOfOrigin: CountryCode, $source: MediaSource, $season: MediaSeason, $seasonYear: Int, $year: String, $onList: Boolean, $yearLesser: FuzzyDateInt, $yearGreater: FuzzyDateInt, $episodeLesser: Int, $episodeGreater: Int, $durationLesser: Int, $durationGreater: Int, $chapterLesser: Int, $chapterGreater: Int, $volumeLesser: Int, $volumeGreater: Int, $licensedBy: [Int], $isLicensed: Boolean, $genres: [String], $excludedGenres: [String], $tags: [String], $excludedTags: [String], $minimumTagRank: Int, $sort: [MediaSort] = [POPULARITY_DESC, SCORE_DESC]) {
    Page(page: $page, perPage: 20) {
      media(id: $id, type: $type, season: $season, format_in: $format, status: $status, countryOfOrigin: $countryOfOrigin, source: $source, search: $search, onList: $onList, seasonYear: $seasonYear, startDate_like: $year, startDate_lesser: $yearLesser, startDate_greater: $yearGreater, episodes_lesser: $episodeLesser, episodes_greater: $episodeGreater, duration_lesser: $durationLesser, duration_greater: $durationGreater, chapters_lesser: $chapterLesser, chapters_greater: $chapterGreater, volumes_lesser: $volumeLesser, volumes_greater: $volumeGreater, licensedById_in: $licensedBy, isLicensed: $isLicensed, genre_in: $genres, genre_not_in: $excludedGenres, tag_in: $tags, tag_not_in: $excludedTags, minimumTagRank: $minimumTagRank, sort: $sort, isAdult: $isAdult) {
        id
        title {
          english
          romaji
          native
        }
        averageScore
        popularity
        bannerImage
        coverImage {
          extraLarge
          large
          color
        }
        format
        seasonYear
        status(version: 2)
        episodes
        isAdult
      }
    }
  }

    `,
        variables: {
          page: 1,
          season: season,
          seasonYear: year,
          type: "ANIME",
        },
      }),
    });
    
    if (!resAnilist.ok) {
      return [];
    }
    
    const anilistData = await resAnilist.json();
    return anilistData?.data?.Page?.media || [];
  } catch (error) {
    console.error("Error fetching this season anime:", error);
    return [];
  }
};

export const getOverallTopAnime = async () => {
  try {
    const resAnilist = await fetch(`https://graphql.anilist.co`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `
              query (
        $id: Int
        $page: Int
        $perPage: Int
        $search: String
        $sort: [MediaSort]
      ) {
        Page(page: $page, perPage: $perPage) {
          pageInfo {
            total
            currentPage
            lastPage
            hasNextPage
            perPage
          }
          media(id: $id, search: $search, sort: $sort type: ANIME) {
            id
            idMal
            status
            format
            episodes
            title {
              romaji
              english
              native
            }
            averageScore
            popularity
            bannerImage
            coverImage {
              large
              extraLarge
            }
            seasonYear
            isAdult
          }
        }
      }
    `,
        variables: {
          page: 1,
          perPage: 30,
          sort: "SCORE_DESC",
        },
      }),
    });

    if (!resAnilist.ok) {
      return [];
    }

    const anilistData = await resAnilist.json();
    return anilistData?.data?.Page?.media || [];
  } catch (error) {
    console.error("Error fetching overall top anime:", error);
    return [];
  }
};
