import Image from "next/image";
import type { Group } from "@/lib/types/group";
import { getFlagUrl } from "@/lib/utils/flags";

interface GroupTableProps {
  group: Group;
}

export default function GroupTable({ group }: GroupTableProps) {
  const getRowColor = (position: number): string => {
    switch (position) {
      case 1:
        return "bg-fifa-green-50 border-l-4 border-fifa-green-500";
      case 2:
        return "bg-fifa-green-50 border-l-4 border-fifa-green-400";
      case 3:
        return "bg-fifa-blue-50 border-l-4 border-fifa-blue-300";
      default:
        return "bg-white border-l-4 border-gray-200";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-fifa-blue-900 text-white px-3 py-2 text-center font-bold text-sm">
        Group {group.name}
      </div>
      <table className="w-full text-xs" role="table" aria-label={`Group ${group.name} standings`}>
        <thead>
          <tr className="text-gray-500 border-b border-gray-200">
            <th className="py-1 px-1 text-center w-6">#</th>
            <th className="py-1 px-1 text-left">Team</th>
            <th className="py-1 px-1 text-center w-6">P</th>
            <th className="py-1 px-1 text-center w-6">W</th>
            <th className="py-1 px-1 text-center w-6">D</th>
            <th className="py-1 px-1 text-center w-6">L</th>
            <th className="py-1 px-1 text-center w-6">GF</th>
            <th className="py-1 px-1 text-center w-6">GA</th>
            <th className="py-1 px-1 text-center w-6">GD</th>
            <th className="py-1 px-1 text-center w-8 font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {group.standings.map((standing) => (
            <tr
              key={standing.team.id}
              className={`hover:bg-gray-50 transition-colors ${getRowColor(standing.position)}`}
            >
              <td className="py-1 px-1 text-center text-gray-500">
                {standing.position}
              </td>
              <td className="py-1 px-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex-shrink-0 w-5 h-4 relative">
                    {standing.team.flag ? (
                      <Image
                        src={standing.team.flag}
                        alt={`${standing.team.name} flag`}
                        width={20}
                        height={16}
                        className="rounded-sm object-cover"
                        loading="lazy"
                        onError={(e) => {
                          const iso2 = standing.team.iso2;
                          if (iso2) {
                            (e.target as HTMLImageElement).src = getFlagUrl(iso2);
                          }
                        }}
                      />
                    ) : (
                      <div className="w-5 h-4 bg-gray-200 rounded-sm" />
                    )}
                  </div>
                  <span className="font-medium text-gray-800 truncate">
                    {standing.team.name}
                  </span>
                </div>
              </td>
              <td className="py-1 px-1 text-center text-gray-600">
                {standing.played}
              </td>
              <td className="py-1 px-1 text-center text-gray-600">
                {standing.won}
              </td>
              <td className="py-1 px-1 text-center text-gray-600">
                {standing.drawn}
              </td>
              <td className="py-1 px-1 text-center text-gray-600">
                {standing.lost}
              </td>
              <td className="py-1 px-1 text-center text-gray-600">
                {standing.goalsFor}
              </td>
              <td className="py-1 px-1 text-center text-gray-600">
                {standing.goalsAgainst}
              </td>
              <td className="py-1 px-1 text-center text-gray-600">
                {standing.goalDifference > 0
                  ? `+${standing.goalDifference}`
                  : standing.goalDifference}
              </td>
              <td className="py-1 px-1 text-center font-bold text-fifa-blue-700">
                {standing.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
