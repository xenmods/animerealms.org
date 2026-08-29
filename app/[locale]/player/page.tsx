"use client";

import { MediaPlayer } from "@/components/player/player";
import { useState } from "react";

export default function Home() {
  const [source] = useState(
    "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  );

  return (
    <div className="watch-page-container w-screen h-screen overflow-hidden bg-black">
      <MediaPlayer
        animeDetails={{
          id: 21,
          idMal: 21,
          title: {
            english: "One Piece",
            romaji: "One Piece",
            native: "ワンピース",
          },
          description:
            "Gol D. Roger, a man referred to as the King of the Pirates, is set to be executed by the World Government.",
          coverImage: {
            extraLarge:
              "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-YCDoj1EkAxFn.jpg",
            large:
              "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21-YCDoj1EkAxFn.jpg",
          },
          bannerImage:
            "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqd.jpg",
          episodes: 1107,
        }}
        episode={{
          id: 1107,
          episode_number: 1107,
          title: "A Shudder! The Evil Hand Creeping Up on the Laboratory",
          name: "Episode 1107",
          description: "No Description",
          still_path:
            "https://s4.anilist.co/file/anilistcdn/media/anime/banner/21-wf37VakJmZqd.jpg",
        }}
        episodes={[
          {
            id: 1107,
            episode_number: 1107,
            title: "A Shudder! The Evil Hand Creeping Up on the Laboratory",
          },
        ]}
        src={source}
      />
    </div>
  );
}

