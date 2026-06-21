import type { Group } from "./group";
import type { Match } from "./match";

export interface BracketRound {
  roundName: string;
  matches: Match[];
}

export interface Tournament {
  groups: Group[];
  matches: Match[];
  rounds: BracketRound[];
  lastUpdated: string | null;
}
