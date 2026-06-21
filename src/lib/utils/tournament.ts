import type { Team } from "@/lib/types/team";
import type { Match, MatchStage, MatchStatus, TeamInfo } from "@/lib/types/match";
import type { Group, GroupStanding } from "@/lib/types/group";
import type { BracketRound, Tournament } from "@/lib/types/tournament";
import type { ApiTeam, ApiGroup, ApiMatch } from "@/lib/types/api";
import pastChampionshipsRaw from "@/data/past-championships.json";
const pastChampionships: Record<string, number> = pastChampionshipsRaw;

// Past championship lookup
export function getPastChampionships(fifaCode: string): number {
  return pastChampionships[fifaCode] ?? 0;
}

// Safe integer parser: returns fallback for null/undefined/non-numeric values
export function safeParseInt(
  value: string | number | null | undefined,
  fallback = 0
): number {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "number") return Number.isNaN(value) ? fallback : value;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

// Transform API team to internal Team type
export function transformApiTeam(apiTeam: ApiTeam): Team {
  return {
    id: safeParseInt(apiTeam.id),
    name: apiTeam.name_en,
    code: apiTeam.fifa_code,
    iso2: apiTeam.iso2,
    flag: apiTeam.flag || `https://flagcdn.com/w40/${apiTeam.iso2.toLowerCase()}.png`,
    pastChampionships: getPastChampionships(apiTeam.fifa_code),
    group: apiTeam.groups,
  };
}

// Transform API team to TeamInfo
export function transformApiTeamToInfo(apiTeam: ApiTeam): TeamInfo {
  return {
    id: safeParseInt(apiTeam.id),
    name: apiTeam.name_en,
    code: apiTeam.fifa_code,
    iso2: apiTeam.iso2,
    flag: apiTeam.flag || `https://flagcdn.com/w40/${apiTeam.iso2.toLowerCase()}.png`,
  };
}

// Transform API group to internal Group type
export function transformApiGroup(
  apiGroup: ApiGroup,
  teamsMap: Map<number, Team>
): Group {
  const standings: GroupStanding[] = apiGroup.teams
    .map((t) => {
      const team = teamsMap.get(safeParseInt(t.team_id));
      if (!team) return null;
      return {
        position: 0, // will be set after sorting
        team,
        played: safeParseInt(t.mp),
        won: safeParseInt(t.w),
        drawn: safeParseInt(t.d),
        lost: safeParseInt(t.l),
        goalsFor: safeParseInt(t.gf),
        goalsAgainst: safeParseInt(t.ga),
        goalDifference: safeParseInt(t.gd),
        points: safeParseInt(t.pts),
      };
    })
    .filter((s): s is GroupStanding => s !== null);

  // Sort by FIFA tiebreaker rules (points → GD → GF → alphabetical)
  standings.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.team.name.localeCompare(b.team.name);
  });

  // Set positions
  standings.forEach((s, i) => {
    s.position = i + 1;
  });

  return {
    name: apiGroup.name,
    teams: standings.map((s) => s.team),
    standings,
  };
}

// Build tournament bracket from match data
export function buildBracketRounds(matches: Match[]): BracketRound[] {
  const rounds: BracketRound[] = [];

  const stageOrder: { key: MatchStage; label: string }[] = [
    { key: "round_of_32", label: "Round of 32" },
    { key: "quarterfinals", label: "Quarterfinals" },
    { key: "semifinals", label: "Semifinals" },
    { key: "final", label: "Final" },
    { key: "third_place", label: "Third Place" },
  ];

  for (const stage of stageOrder) {
    const stageMatches = matches.filter((m) => m.stage === stage.key);
    if (stageMatches.length > 0) {
      rounds.push({
        roundName: stage.label,
        matches: stageMatches,
      });
    }
  }

  return rounds;
}

// Build full tournament object from API data
export function buildTournament(
  teams: Team[],
  groups: Group[],
  matches: Match[]
): Tournament {
  const rounds = buildBracketRounds(matches);
  return {
    groups,
    matches,
    rounds,
    lastUpdated: new Date().toISOString(),
  };
}

// Transform API match to internal Match type
export function transformApiMatch(
  apiMatch: ApiMatch,
  teamsMap: Map<number, Team>
): Match {
  const homeId = safeParseInt(apiMatch.home_team_id);
  const awayId = safeParseInt(apiMatch.away_team_id);

  const homeTeam =
    homeId === 0
      ? createTbdTeamInfo()
      : transformApiTeamToInfo({
          _id: "",
          id: apiMatch.id.toString(),
          name_en: apiMatch.home_team_label || apiMatch.home_team_name,
          name_fa: "",
          flag: apiMatch.home_team_flag || "",
          fifa_code: apiMatch.home_team_code,
          iso2: teamsMap.get(homeId)?.iso2 ?? "",
          groups: "",
        });

  const awayTeam =
    awayId === 0
      ? createTbdTeamInfo()
      : transformApiTeamToInfo({
          _id: "",
          id: apiMatch.id.toString(),
          name_en: apiMatch.away_team_label || apiMatch.away_team_name,
          name_fa: "",
          flag: apiMatch.away_team_flag || "",
          fifa_code: apiMatch.away_team_code,
          iso2: teamsMap.get(awayId)?.iso2 ?? "",
          groups: "",
        });

  const homeScore = safeParseInt(apiMatch.home_score?.toString());
  const awayScore = safeParseInt(apiMatch.away_score?.toString());

  // Map API status string to our MatchStatus
  let status: MatchStatus = "scheduled";
  if (apiMatch.status === "finished" || apiMatch.status === "FT") {
    status = "finished";
  } else if (apiMatch.status === "in_progress" || apiMatch.status === "LIVE") {
    status = "in_progress";
  }

  // Map API stage string to our MatchStage
  let stage: MatchStage = "group";
  const stageLower = apiMatch.stage.toLowerCase();
  if (stageLower.includes("round of 32") || stageLower.includes("r32")) stage = "round_of_32";
  else if (stageLower.includes("quarterfinal") || stageLower.includes("qf")) stage = "quarterfinals";
  else if (stageLower.includes("semi")) stage = "semifinals";
  else if (stageLower === "final") stage = "final";
  else if (stageLower.includes("third place") || stageLower.includes("3rd")) stage = "third_place";
  else if (stageLower.includes("group")) stage = "group";

  return {
    id: apiMatch.id,
    homeTeam,
    awayTeam,
    homeScore: homeScore > 0 || apiMatch.home_score !== null ? homeScore : null,
    awayScore: awayScore > 0 || apiMatch.away_score !== null ? awayScore : null,
    status,
    stage,
    date: apiMatch.date,
    group: apiMatch.group || undefined,
    winnerId: status === "finished" && homeScore !== awayScore
      ? homeScore > awayScore ? homeId : awayId
      : null,
  };
}

// Get team by ID from teams map
export function getTeamById(teamsMap: Map<number, Team>, id: number): Team | null {
  return teamsMap.get(id) ?? null;
}

// Create a TBD team placeholder
export function createTbdTeamInfo(): TeamInfo {
  return {
    id: 0,
    name: "TBD",
    code: "TBD",
    iso2: "",
    flag: "",
  };
}

// Determine match status from scores
export function determineMatchStatus(
  homeScore: number | null,
  awayScore: number | null
): MatchStatus {
  if (homeScore === null || awayScore === null) return "scheduled";
  return "finished";
}

// Get winner team ID from match
export function getWinnerId(match: Match): number | null {
  if (match.status !== "finished") return null;
  if (match.homeScore === null || match.awayScore === null) return null;
  if (match.homeScore > match.awayScore) return match.homeTeam?.id ?? null;
  if (match.awayScore > match.homeScore) return match.awayTeam?.id ?? null;
  return null; // draw
}
