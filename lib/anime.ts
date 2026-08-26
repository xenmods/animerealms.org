import cloudscraper from "cloudscraper";

const animeInfoCache = new Map<number, any>();

export async function getAnimeInfo(anilistId: number) {
  if (animeInfoCache.has(anilistId)) {
    return animeInfoCache.get(anilistId);
  }

  const query = `
    query ($id: Int) {
      Media(id: $id, type: ANIME) {
        id
        idMal
        title {
          romaji
          english
          native
        }
        startDate {
          year
          month
          day
        }
        status
      }
    }
  `;

  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { id: anilistId },
      }),
    });

    if (!response.ok) return null;
    const resData = await response.json();
    const media = resData?.data?.Media || null;
    if (media) {
      animeInfoCache.set(anilistId, media);
    }
    return media;
  } catch {
    return null;
  }
}

export async function getKuroiruMapping(anilistId: number) {
  try {
    const animeInfo = await getAnimeInfo(anilistId);
    const malId = animeInfo?.idMal;
    if (!malId) {
      return null;
    }
    const kuroiruResponse = await cloudscraper.get(
      `https://kuroiru.co/api/anime/${malId}`
    );
    const kuroiruData = JSON.parse(kuroiruResponse);
    return kuroiruData?.streams || null;
  } catch (error) {
    return null;
  }
}
