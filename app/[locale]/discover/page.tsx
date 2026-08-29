import DiscoverPage from "@/components/discover/discover-page";
import { OfflineGuard } from "@/components/desktop/offline-guard";

export default function Discover() {
  return (
    <OfflineGuard pageTitle="Discover">
      <DiscoverPage />
    </OfflineGuard>
  );
}

