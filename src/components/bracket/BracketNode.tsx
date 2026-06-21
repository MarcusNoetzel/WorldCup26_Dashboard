import Image from "next/image";
import type { TeamInfo } from "@/lib/types/match";
import { getFlagUrl } from "@/lib/utils/flags";
import { getPastChampionships } from "@/lib/utils/tournament";

interface BracketNodeProps {
  team: TeamInfo | null;
  score: number | null;
  isWinner: boolean;
  isTbd: boolean;
  status: "scheduled" | "in_progress" | "finished";
}

export default function BracketNode({
  team,
  score,
  isWinner,
  isTbd,
  status,
}: BracketNodeProps) {
  const flagUrl = team?.flag || (team?.iso2 ? getFlagUrl(team.iso2) : "");
  const championships = team ? getPastChampionships(team.code) : 0;

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-2 rounded-lg border transition-all duration-200
        min-w-[180px] max-w-[220px]
        ${isWinner ? "bg-fifa-gold-50 border-fifa-gold-400 shadow-md" : "bg-white border-gray-200"}
        ${isTbd ? "border-dashed border-gray-300 bg-gray-50" : ""}
        ${!isTbd && !isWinner ? "hover:shadow-md hover:border-fifa-blue-300" : ""}
      `}
      role="listitem"
      aria-label={
        team
          ? `${team.name} ${score !== null ? `score ${score}` : ""}`
          : "Team to be determined"
      }
    >
      {/* Flag */}
      <div className="flex-shrink-0 w-8 h-6 relative">
        {flagUrl ? (
          <Image
            src={flagUrl}
            alt={`${team?.name || "TBD"} flag`}
            width={32}
            height={24}
            className="rounded object-cover"
            loading="lazy"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              const iso2 = team?.iso2;
              if (iso2) {
                img.src = `https://flagcdn.com/w40/${iso2.toLowerCase()}.png`;
              } else {
                img.style.display = "none";
              }
            }}
          />
        ) : (
          <div className="w-8 h-6 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-400">
            ?
          </div>
        )}
      </div>

      {/* Team info */}
      <div className="flex-1 min-w-0">
        <div
          className={`text-sm font-semibold truncate ${isWinner ? "text-fifa-gold-700" : "text-gray-800"}`}
        >
          {team?.name || "TBD"}
        </div>
        {championships > 0 && (
          <div className="text-xs text-gray-500">
            (🏆 {championships})
          </div>
        )}
      </div>

      {/* Score */}
      {score !== null && (
        <div
          className={`
            flex-shrink-0 text-lg font-bold w-8 text-center
            ${isWinner ? "text-fifa-gold-600" : "text-gray-700"}
          `}
        >
          {score}
        </div>
      )}

      {/* Status indicator */}
      {status === "in_progress" && (
        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
      )}
    </div>
  );
}
