import { notFound } from "next/navigation";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import Navbar from "@/components/shared/navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  PlayCircle,
  Star,
  Tv,
  Heart,
  User as UserIcon,
  Palette,
  Clapperboard,
} from "lucide-react";
import ProfileCharts from "./profile-charts"; // We'll create this client component for Recharts
import { getTranslations } from "next-intl/server";
import AnimeList from "@/components/shared/anime-list";
import UserWatchLists from "@/components/user/user-watch-lists";

// Define Types
interface UserProfile {
  id: number;
  name: string;
  about: string;
  avatar: {
    large: string;
  };
  bannerImage: string;
  statistics: {
    anime: {
      count: number;
      meanScore: number;
      minutesWatched: number;
      episodesWatched: number;
      genres: {
        genre: string;
        count: number;
      }[];
      studios: {
        studio: {
          name: string;
        };
        count: number;
      }[];
    };
  };
  favourites: {
    anime: {
      nodes: {
        id: number;
        title: {
          userPreferred: string;
        };
        coverImage: {
          large: string;
        };
      }[];
    };
    characters: {
      nodes: {
        id: number;
        name: {
          full: string;
        };
        image: {
          large: string;
        };
      }[];
    };
  };
}

async function getUserData(username: string): Promise<UserProfile | null> {
  const query = `
    query ($name: String) {
      User(name: $name) {
        id
        name
        about
        avatar {
          large
        }
        bannerImage
        statistics {
          anime {
            count
            meanScore
            minutesWatched
            episodesWatched
            genres(limit: 5, sort: COUNT_DESC) {
              genre
              count
            }
            studios(limit: 5, sort: COUNT_DESC) {
              studio {
                name
              }
              count
            }
          }
        }
        favourites {
          anime(page: 1, perPage: 8) {
            nodes {
              id
              title {
                userPreferred
              }
              coverImage {
                large
              }
            }
          }
          characters(page: 1, perPage: 8) {
            nodes {
              id
              name {
                full
              }
              image {
                large
              }
            }
          }
        }
      }
      MediaListCollection(userName: $name, type: ANIME, sort: UPDATED_TIME_DESC) {
        lists {
          name
          entries {
            progress
            media {
              id
              title {
                userPreferred
                english
                romaji
              }
              coverImage {
                large
                extraLarge
              }
              format
              seasonYear
              episodes
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        query,
        variables: { name: username },
      }),
      next: { revalidate: 3600 }, // Revalidate every hour
    });

    const data = await res.json();
    return {
      ...data.data?.User,
      mediaListCollection: data.data?.MediaListCollection,
    };
  } catch (error) {
    console.error("Error fetching user data:", error);
    return null;
  }
}

function formatTime(minutes: number) {
  const days = Math.floor(minutes / 1440);
  const remainingMinutes = minutes % 1440;
  const hours = Math.floor(remainingMinutes / 60);
  return `${days}d ${hours}h`;
}

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const data: any = await getUserData(username);
  const t = await getTranslations("UserProfile");

  if (!data) {
    notFound();
  }
  const user = data; // Rename for clarity
  const lists = data.mediaListCollection?.lists || [];
  const animeStats = user.statistics.anime;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Banner */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <div className="absolute top-0 left-0 w-full z-50 bg-gradient-to-b from-black/80 via-black/40 to-transparent">
          <div className="container mx-auto px-4 py-4">
            <Navbar />
          </div>
        </div>
        {user.bannerImage ? (
          <Image
            src={user.bannerImage}
            alt="Banner"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="w-full h-full bg-muted/30 flex items-center justify-center">
            <span className="text-muted-foreground">{t("noBanner")}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container max-w-7xl mx-auto px-4 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-6 items-end mb-8">
          <div className="relative w-40 h-40 md:w-52 md:h-52 rounded-xl overflow-hidden border-4 border-background shadow-2xl shrink-0">
            <Image
              src={user.avatar.large}
              alt={user.name}
              fill
              className="object-cover"
            />
          </div>
          <div className="flex-1 mb-2">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              {user.name}
            </h1>
            {/* Simple bio truncation or rendering */}
            {user.about && (
              <div
                className="mt-2 text-muted-foreground line-clamp-2 max-w-2xl prose prose-sm dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: user.about }}
              />
            )}
          </div>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Stats Overview - Tall Card */}
          <Card className="col-span-1 row-span-2 md:col-span-2 lg:col-span-1 lg:row-span-2 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-primary" />
                {t("overview")}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-around gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" /> {t("episodesWatched")}
                </p>
                <p className="text-3xl font-bold">
                  {animeStats.episodesWatched.toLocaleString()}
                </p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4" /> {t("timeWasted")}
                </p>
                <p className="text-3xl font-bold">
                  {formatTime(animeStats.minutesWatched)}
                </p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Tv className="w-4 h-4" /> {t("animeCompleted")}
                </p>
                <p className="text-3xl font-bold">
                  {animeStats.count.toLocaleString()}
                </p>
              </div>
              <Separator />
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Star className="w-4 h-4" /> {t("meanScore")}
                </p>
                <p className="text-3xl font-bold">{animeStats.meanScore}%</p>
              </div>
            </CardContent>
          </Card>

          {/* Genre Distribution - Wide Card */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-primary" />
                {t("genreDistribution")}
              </CardTitle>
              <CardDescription>
                {t("genreDistributionDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ProfileCharts data={animeStats.genres} type="genre" />
            </CardContent>
          </Card>

          {/* Top Studios - Tall Card */}
          <Card className="col-span-1 md:col-span-1 lg:col-span-1 row-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clapperboard className="w-5 h-5 text-primary" />
                {t("topStudios")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  {animeStats.studios.map((studio: any, idx: number) => (
                    <div
                      key={studio.studio.name}
                      className="flex items-center justify-between"
                    >
                      <span
                        className="text-sm font-medium truncate max-w-[120px]"
                        title={studio.studio.name}
                      >
                        {idx + 1}. {studio.studio.name}
                      </span>
                      <Badge variant="secondary">{studio.count}</Badge>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Favorites Anime - Wide Card */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-red-500" />
                {t("favoriteAnime")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {user.favourites.anime.nodes.map((anime: any) => (
                  <Link
                    key={anime.id}
                    href={`/watch/${anime.id}/1`}
                    className="relative aspect-[2/3] rounded-md overflow-hidden group block"
                  >
                    <Image
                      src={anime.coverImage.large}
                      alt={anime.title.userPreferred}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-xs text-white font-medium line-clamp-2">
                        {anime.title.userPreferred}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Favorite Characters - Wide Card */}
          <Card className="col-span-1 md:col-span-2 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="w-5 h-5 text-blue-500" />
                {t("favoriteCharacters")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2">
                {user.favourites.characters.nodes.map((char: any) => (
                  <div
                    key={char.id}
                    className="relative aspect-[2/3] rounded-md overflow-hidden group"
                  >
                    <Image
                      src={char.image.large}
                      alt={char.name.full}
                      fill
                      className="object-cover transition-transform group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-xs text-white font-medium line-clamp-2">
                        {char.name.full}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Watch Lists Section */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold">{t("watchLists")}</h2>
          <UserWatchLists lists={lists} />
        </div>
      </div>
    </div>
  );
}
