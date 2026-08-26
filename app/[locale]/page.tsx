import {
  fetchTrendingAnime,
  fetchPopularAnime,
  getAnilistThisSeason,
  getOverallTopAnime,
} from "@/lib/home";
import { getAllProgress } from "@/components/shared/action";
import HomePage from "@/components/home/home-page";
import clientPromise from "@/lib/db";
import { auth } from "@/auth";
import { getTodaySchedule } from "@/lib/schedule";

import { InstallPrompt } from "@/components/pwa/install-prompt";

export default async function Home() {
  const session = await auth();
  // check db for cache
  const client = await clientPromise;
  const db = client.db("animerealms_v2");
  const collection = db.collection("home_cache");
  const data = await collection.findOne({ _id: "home" });
  let watched: Array<any>[] | null = session?.user?.name
    ? await getAllProgress(session.user.name)
    : null;
  if (watched !== null) {
    watched = watched.reverse();
  }
  if (data) {
    // If cache exists, we might want to refresh schedule independently or accept it's cached.
    // For "today's" schedule, 24h cache might be too stale if it crosses midnight.
    // For now, let's assume cache invalidation handles it or we re-fetch schedule if needed.
    // Ideally we should separate schedule from the main heavy cache if it changes more often.
    // Let's re-fetch schedule here to ensure it's up to date if we want, OR just rely on the 1h revalidate in fetch.
    // But since we are reading from DB cache, that cache might be old.
    // Let's just pass data.todaySchedule if it exists, explaining the migration.
    // Since we are modding the DB schema implicitly, new cache entries will have it.
    // Old cache entries won't.
    // Let's fetch schedule separately if missing from cache.
    let todaySchedule = data.todaySchedule;
    if (!todaySchedule) {
      todaySchedule = await getTodaySchedule();
    }

    return (
      <>
        <InstallPrompt />
        <HomePage
          trendingAnime={data.trendingAnime}
          popularAnime={data.popularAnime}
          thisSeasonAnime={data.thisSeasonAnime}
          topAnime={data.topAnime}
          watched={watched}
          todaySchedule={todaySchedule}
        />
      </>
    );
  }
  // Start all fetches at the same time
  const [
    trendingAnime,
    popularAnime,
    thisSeasonAnime,
    topAnime,
    todaySchedule,
  ] = await Promise.all([
    fetchTrendingAnime(),
    fetchPopularAnime(),
    getAnilistThisSeason(),
    getOverallTopAnime(),
    getTodaySchedule(),
  ]);

  // store in cache
  await collection.insertOne({
    _id: "home",
    trendingAnime,
    popularAnime,
    thisSeasonAnime,
    topAnime,
    todaySchedule,
    cachedAt: new Date(),
  });

  return (
    <>
      <InstallPrompt />
      <HomePage
        trendingAnime={trendingAnime}
        popularAnime={popularAnime}
        thisSeasonAnime={thisSeasonAnime}
        topAnime={topAnime}
        watched={watched}
        todaySchedule={todaySchedule}
      />
    </>
  );
}
