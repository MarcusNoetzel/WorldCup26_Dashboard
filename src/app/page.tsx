export const revalidate = 60;

import { fetchTeams, fetchGroups, fetchMatches } from "@/lib/api/worldcup26";
import {
  transformApiTeam,
  transformApiGroup,
  transformApiMatch,
  buildTournament,
} from "@/lib/utils/tournament";
import Dashboard from "./Dashboard";

/**
 * Server component — fetches tournament data with revalidate: 60
 * Passes data as props to the client Dashboard component.
 */
export default async function Home() {
  const [teamsData, groupsData, matchesData] = await Promise.all([
    fetchTeams(),
    fetchGroups(),
    fetchMatches().catch(() => ({ matches: [] })),
  ]);

  const teams = teamsData.teams.map(transformApiTeam);
  const teamsMap = new Map<number, typeof teams[number]>(
    teams.map((t) => [t.id, t])
  );

  const groups = groupsData.groups.map((g) => transformApiGroup(g, teamsMap));
  const matches = (matchesData?.matches ?? []).map((m) =>
    transformApiMatch(m, teamsMap)
  );

  const tournament = buildTournament(teams, groups, matches);

  return (
    <Dashboard
      initialTournament={tournament}
      lastUpdated={tournament.lastUpdated}
    />
  );
}
