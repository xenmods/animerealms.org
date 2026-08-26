"use server";

import clientPromise from "@/lib/db";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";

const ANILIST_API_URL = "https://graphql.anilist.co";

export interface AnimeReel {
  id: number;
  title: {
    romaji: string;
    english: string;
    native: string;
  };
  description: string;
  bannerImage: string;
  coverImage: {
    extraLarge: string;
    large: string;
    color: string;
  };
  trailer: {
    id: string;
    site: string;
    thumbnail: string;
  } | null;
  genres: string[];
  averageScore: number;
  friendActivity?: {
    user: {
      name: string;
      avatar: string;
    };
    status: string;
    progress: string;
    id: number;
  };
}

export interface LikingUser {
  name?: string;
  image?: string;
  id: string;
}

const QUERY_REELS = `
  query ($page: Int, $sort: [MediaSort]) {
    Page(page: $page, perPage: 50) {
      pageInfo {
        hasNextPage
        lastPage
      }
      media(type: ANIME, sort: $sort, isAdult: false) {
        id
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
        trailer {
          id
          site
          thumbnail
        }
        genres
        averageScore
      }
    }
  }
`;

const QUERY_ACTIVITIES = `
query ($page: Int) {
  Page(page: $page, perPage: 20) {
    activities(type: ANIME_LIST, isFollowing: true, sort: ID_DESC) {
      ... on ListActivity {
        id
        status
        progress
        user {
          name
          avatar {
            medium
          }
        }
        media {
          id
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
          trailer {
            id
            site
            thumbnail
          }
          genres
          averageScore
        }
      }
    }
  }
}
`;

async function getFriendActivities(accessToken: string): Promise<AnimeReel[]> {
  try {
    const response = await fetch(ANILIST_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: QUERY_ACTIVITIES,
        variables: { page: 1 },
      }),
      next: { revalidate: 60 },
    });

    const data = await response.json();
    if (data.errors) return [];

    const activities = data.data.Page.activities;

    const activityReels: AnimeReel[] = activities
      .filter(
        (act: any) =>
          act.media &&
          act.media.trailer &&
          act.media.trailer.site === "youtube" &&
          act.media.trailer.id
      )
      .map((act: any) => ({
        ...act.media,
        friendActivity: {
          user: {
            name: act.user.name,
            avatar: act.user.avatar.medium,
          },
          status: act.status,
          progress: act.progress,
          id: act.id,
        },
      }));

    return activityReels;
  } catch (e) {
    console.error("Error fetching activities", e);
    return [];
  }
}

export async function getReelFeed(page: number = 1): Promise<AnimeReel[]> {
  const session = await auth();

  const rand = Math.random();
  let sort = ["TRENDING_DESC"];
  if (rand > 0.6) sort = ["POPULARITY_DESC"];
  if (rand > 0.9) sort = ["FAVOURITES_DESC"];

  const apiPage = page + Math.floor(Math.random() * 5);

  try {
    const reelsPromise = fetch(ANILIST_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query: QUERY_REELS,
        variables: { page: apiPage, sort: sort },
      }),
      next: { revalidate: 60 },
    }).then((res) => res.json());

    let activitiesPromise: Promise<AnimeReel[]> = Promise.resolve([]);
    if (session?.user && (session.user as any).token) {
      activitiesPromise = getFriendActivities((session.user as any).token);
    }

    const [reelsData, activityReels] = await Promise.all([
      reelsPromise,
      activitiesPromise,
    ]);

    if (reelsData.errors) {
      console.error("AniList Error:", reelsData.errors);
      return [];
    }

    const media = reelsData.data.Page.media;

    let reels = media.filter(
      (anime: any) =>
        anime.trailer && anime.trailer.site === "youtube" && anime.trailer.id
    );

    for (let i = reels.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [reels[i], reels[j]] = [reels[j], reels[i]];
    }

    if (activityReels.length > 0) {
      let combined: AnimeReel[] = [];
      let rIdx = 0;
      let aIdx = 0;

      while (rIdx < reels.length) {
        combined.push(reels[rIdx]);
        rIdx++;

        if (aIdx < activityReels.length && Math.random() > 0.7) {
          combined.push(activityReels[aIdx]);
          aIdx++;
        }
      }
      reels = combined;
    }

    return reels;
  } catch (error) {
    console.error("Error fetching reels:", error);
    return [];
  }
}

export async function toggleLike(animeId: string) {
  const session = await auth();
  if (!session?.user) {
    return { liked: false, error: "Unauthorized" };
  }

  const client = await clientPromise;
  const db = client.db("animerealms_v2");
  const collection = db.collection("reel_likes");

  const userId = session.user.id || session.user.email;
  const query = { animeId: animeId.toString(), userId: userId };

  const existing = await collection.findOne(query);

  if (existing) {
    await collection.deleteOne(query);
    return { liked: false };
  } else {
    const user = session.user;
    await collection.insertOne({
      ...query,
      createdAt: new Date(),
      userName: user.name,
      userImage: user.image,
    });
    return { liked: true };
  }
}

export async function getLikeStatus(animeId: string) {
  const session = await auth();
  const client = await clientPromise;
  const db = client.db("animerealms_v2");

  const count = await db
    .collection("reel_likes")
    .countDocuments({ animeId: animeId.toString() });

  let liked = false;
  if (session?.user) {
    const userId = session.user.id || session.user.email;
    const existing = await db.collection("reel_likes").findOne({
      animeId: animeId.toString(),
      userId: userId,
    });
    if (existing) liked = true;
  }

  return { liked, count };
}

export async function getReelLikes(animeId: string): Promise<LikingUser[]> {
  const client = await clientPromise;
  const db = client.db("animerealms_v2");

  const likes = await db
    .collection("reel_likes")
    .find({ animeId: animeId.toString() })
    .toArray();

  if (likes.length === 0) return [];

  const results: LikingUser[] = [];
  const missingUserIds: string[] = [];

  for (const like of likes) {
    if (like.userName) {
      results.push({
        id: like.userId,
        name: like.userName,
        image: like.userImage,
      });
    } else {
      missingUserIds.push(like.userId);
    }
  }

  if (missingUserIds.length > 0) {
    const objectIds = missingUserIds
      .filter((id) => ObjectId.isValid(id))
      .map((id) => new ObjectId(id));

    const emails = missingUserIds.filter((id) => id.includes("@"));

    const users = await db
      .collection("users")
      .find({
        $or: [
          { _id: { $in: objectIds } },
          { email: { $in: emails } },
          { id: { $in: missingUserIds } },
        ],
      })
      .toArray();

    const fetchedUsers = users.map((user) => ({
      id: user._id.toString(),
      name: user.name,
      image: user.image,
    }));

    results.push(...fetchedUsers);
  }

  return results;
}
