import type { Group } from "@/lib/types/group";
import GroupTable from "./GroupTable";

interface GroupStandingsProps {
  groups: Group[];
  isLoading: boolean;
}

export default function GroupStandings({ groups, isLoading }: GroupStandingsProps) {
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold text-fifa-blue-900 mb-8 text-center">
          Group Stage Standings
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div
              key={i}
              className="animate-pulse bg-white rounded-lg shadow-sm border border-gray-200 h-48"
            />
          ))}
        </div>
      </div>
    );
  }

  // Sort groups alphabetically
  const sortedGroups = [...groups].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-fifa-blue-900 mb-2 text-center">
        Group Stage Standings
      </h2>
      <p className="text-center text-gray-500 text-sm mb-8">
        Top 2 from each group + 4 best 3rd-place teams advance to Round of 32
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedGroups.map((group) => (
          <GroupTable key={group.name} group={group} />
        ))}
      </div>
    </div>
  );
}
