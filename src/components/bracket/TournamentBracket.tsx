import type { BracketRound as BracketRoundType } from "@/lib/types/tournament";
import BracketRound from "./BracketRound";

interface TournamentBracketProps {
  rounds: BracketRoundType[];
  isLoading: boolean;
}

export default function TournamentBracket({
  rounds,
  isLoading,
}: TournamentBracketProps) {
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-4">
              <div className="h-6 bg-gray-200 rounded w-48 mx-auto" />
              <div className="flex justify-center gap-4">
                <div className="h-16 bg-gray-200 rounded w-52" />
                <div className="h-16 bg-gray-200 rounded w-52" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (rounds.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <div className="text-4xl mb-4">🏆</div>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          Knockout Stage
        </h2>
        <p className="text-gray-500">
          The knockout bracket will appear here once the group stage is complete.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-fifa-blue-900 mb-8 text-center">
        Knockout Stage Bracket
      </h2>
      <div className="space-y-12">
        {rounds.map((round) => (
          <BracketRound
            key={round.roundName}
            roundName={round.roundName}
            matches={round.matches}
          />
        ))}
      </div>
    </div>
  );
}
