import { ReelFeed } from "@/components/reels/ReelFeed";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Visions",
  description: "Discover new anime with short trailers.",
};

export default function VisionsPage() {
  return <ReelFeed />;
}
