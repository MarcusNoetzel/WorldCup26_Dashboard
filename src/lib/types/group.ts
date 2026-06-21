import type { Team } from "./team";

export interface GroupStanding {
  position: number;
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface Group {
  name: string; // Group letter (A-L)
  teams: Team[];
  standings: GroupStanding[];
}
