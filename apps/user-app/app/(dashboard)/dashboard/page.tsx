import { ActivityFeed } from "../../../components/ActivityFeed";
import { Leaderboard } from "../../../components/Leaderboard";

export default function DashboardPage() {
  return (
    <div className="w-full p-4">
      <div className="text-4xl text-[#6a51a6] pt-8 mb-8 font-bold">Dashboard</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ActivityFeed />
        <Leaderboard />
      </div>
    </div>
  );
}
