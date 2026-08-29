import { ReelFeed } from "@/components/reels/ReelFeed";
import { Metadata } from "next";
import { OfflineGuard } from "@/components/desktop/offline-guard";

export const metadata: Metadata = {
  title: "Visions",
  description: "Discover new anime with short trailers.",
};

export default function VisionsPage() {
  return (
    <OfflineGuard pageTitle="Visions">
      <ReelFeed />
    </OfflineGuard>
  );
}

