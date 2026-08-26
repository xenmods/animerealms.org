"use client";

import { MediaPlayer } from "@/components/player/player";
import { useState } from "react";

export default function Home() {
  const [source, setSource] = useState(
    "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"
  );

  return (
    <MediaPlayer
      episode={{
        title: "A Shudder! The Evil Hand Creeping Up on the Laboratory",
        description: "No Description",
        number: 1107,
      }}
      src={source}
    />
  );
}
