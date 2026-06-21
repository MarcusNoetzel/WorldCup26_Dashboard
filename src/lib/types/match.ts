export type MatchStatus = "scheduled" | "in_progress" | "finished";

export type MatchStage =
  | "group"
  | "round_of_32"
  | "quarterfinals"
  | "semifinals"
  | "final"
  | "third_place";

export interface Match {
  id: number;
  homeTeam: TeamInfo | null;
  awayTeam: TeamInfo | null;
  homeScore: number | null;
  awayScore: number | null;
  status: MatchStatus;
  stage: MatchStage;
  date: string;
  group?: string;
  winnerId: number | null;
}

export interface TeamInfo {
  id: number;
  name: string;
  code: string;
  iso2: string;
  flag: string;
}
