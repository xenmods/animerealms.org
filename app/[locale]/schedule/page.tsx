import { getWeeklySchedule } from "@/lib/schedule";
import SchedulePage from "@/components/schedule/schedule-page";
import Navbar from "@/components/shared/navbar";

export const metadata = {
  title: "Airing Schedule - Anime Realms",
  description: "Check out the anime airing schedule for this week!",
};

export default async function Page() {
  const schedule = await getWeeklySchedule();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="pt-20">
        {" "}
        {/* Offset for fixed navbar */}
        <SchedulePage schedule={schedule} />
      </div>
    </div>
  );
}
