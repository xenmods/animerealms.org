import {
  startOfDay,
  endOfDay,
  getUnixTime,
  addDays,
  startOfWeek,
  endOfWeek,
} from "date-fns";

const AIRING_SCHEDULE_QUERY = `
query ($page: Int = 1, $airingAtGreater: Int, $airingAtLesser: Int, $perPage: Int = 20) {
  Page(page: $page, perPage: $perPage) {
    pageInfo {
      hasNextPage
      total
    }
    airingSchedules(airingAt_greater: $airingAtGreater, airingAt_lesser: $airingAtLesser, sort: TIME) {
      id
      airingAt
      timeUntilAiring
      episode
      media {
        id
        idMal
        title {
          romaji
          english
          native
        }
        description
        bannerImage
        coverImage {
          extraLarge
          large
          color
        }
        genres
        episodes
        duration
        status
        seasonYear
        averageScore
        format
        popularity
        isAdult
        nextAiringEpisode {
          airingAt
          timeUntilAiring
          episode
        }
        studios {
          nodes {
            name
          }
        }
        trailer {
            id
            site
            thumbnail
        }
      }
    }
  }
}
`;

export async function getAiringSchedule(
  start: number,
  end: number,
  page = 1,
  perPage = 50,
) {
  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: AIRING_SCHEDULE_QUERY,
        variables: {
          airingAtGreater: start,
          airingAtLesser: end,
          page,
          perPage,
        },
      }),
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
      throw new Error(`AniList API error: ${response.statusText}`);
    }

    const json = await response.json();
    return json.data.Page.airingSchedules;
  } catch (error) {
    console.error("Error fetching airing schedule:", error);
    return [];
  }
}

export async function getAllAiringSchedule(
  start: number,
  end: number,
  perPage = 50,
) {
  let allSchedule: any[] = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    try {
      const response = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          query: AIRING_SCHEDULE_QUERY,
          variables: {
            airingAtGreater: start,
            airingAtLesser: end,
            page,
            perPage,
          },
        }),
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (!response.ok) {
        throw new Error(`AniList API error: ${response.statusText}`);
      }

      const json = await response.json();
      const pageData = json.data.Page;

      if (pageData.airingSchedules) {
        allSchedule = [...allSchedule, ...pageData.airingSchedules];
      }

      hasNextPage = pageData.pageInfo.hasNextPage;
      page++;

      // Safety break to prevent infinite loops if something goes wrong
      if (page > 10) hasNextPage = false;
    } catch (error) {
      console.error("Error fetching airing schedule page", page, error);
      hasNextPage = false;
    }
  }

  return allSchedule;
}

export async function getTodaySchedule() {
  const now = new Date();
  const start = getUnixTime(startOfDay(now));
  const end = getUnixTime(endOfDay(now));
  // Today usually doesn't have more than 50 shows, so one page is fine,
  // but using the paginated one is safer if it's a busy day.
  // Keeping original single-fetch for speed if we only need a few,
  // but let's just use the robust one to be safe.
  return getAllAiringSchedule(start, end);
}

export async function getWeeklySchedule() {
  const now = new Date();
  // Get start of week (Monday) to end of week (Sunday)
  // Adjust weekStartsOn if needed (1 = Monday)
  const start = getUnixTime(startOfWeek(now, { weekStartsOn: 1 }));
  const end = getUnixTime(endOfWeek(addDays(now, 6), { weekStartsOn: 1 }));

  return getAllAiringSchedule(start, end);
}
