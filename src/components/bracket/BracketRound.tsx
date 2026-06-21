import type { Match } from "@/lib/types/match";
import BracketNode from "./BracketNode";

interface BracketRoundProps {
  roundName: string;
  matches: Match[];
}

export default function BracketRound({ roundName, matches }: BracketRoundProps) {
  return (
    <div className="mb-8">
      <h3 className="text-lg font-bold text-fifa-blue-900 mb-4 text-center uppercase tracking-wider">
        {roundName}
      </h3>
      <div className="flex flex-col gap-4" role="list" aria-label={roundName}>
        {matches.map((match) => {
          const homeWinner =
            match.status === "finished" &&
            match.homeScore !== null &&
            match.awayScore !== null &&
            match.homeScore > match.awayScore;
          const awayWinner =
            match.status === "finished" &&
            match.homeScore !== null &&
            match.awayScore !== null &&
            match.awayScore > match.homeScore;

          return (
            <div
              key={match.id}
              className="flex items-center justify-center gap-4"
            >
              <BracketNode
                team={match.homeTeam}
                score={match.homeScore}
                isWinner={homeWinner}
                isTbd={match.homeTeam?.id === 0}
                status={match.status}
              />
              <div className="flex-shrink-0 text-gray-400 font-bold text-sm px-2">
                vs
              </div>
              <BracketNode
                team={match.awayTeam}
                score={match.awayScore}
                isWinner={awayWinner}
                isTbd={match.awayTeam?.id === 0}
                status={match.status}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
