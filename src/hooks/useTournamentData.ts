"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Team } from "@/lib/types/team";
import type { Group } from "@/lib/types/group";
import type { Tournament } from "@/lib/types/tournament";
import { fetchTeams, fetchGroups, fetchMatches } from "@/lib/api/worldcup26";
import {
  transformApiTeam,
  transformApiGroup,
  transformApiMatch,
  buildTournament,
} from "@/lib/utils/tournament";

interface UseTournamentDataResult {
  tournament: Tournament | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  refetchMatches: () => Promise<void>;
  lastUpdated: string | null;
}

export function useTournamentData(): UseTournamentDataResult {
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      // Fetch teams and groups in parallel
      const [teamsData, groupsData] = await Promise.all([
        fetchTeams(),
        fetchGroups(),
      ]);

      // Transform teams
      const teams: Team[] = teamsData.teams.map(transformApiTeam);
      const teamsMap = new Map<number, Team>(teams.map((t) => [t.id, t]));

      // Transform groups
      const groups: Group[] = groupsData.groups.map((g) =>
        transformApiGroup(g, teamsMap)
      );

      // Transform matches
      const matchesData = await fetchMatches().catch(() => ({ matches: [] }));
      const matches = (matchesData?.matches ?? []).map((m) =>
        transformApiMatch(m, teamsMap)
      );

      // Build tournament
      const tournament = buildTournament(teams, groups, matches);

      setTournament(tournament);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const refetchMatches = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setError(null);

    try {
      const [teamsData, groupsData, matchesData] = await Promise.all([
        fetchTeams(),
        fetchGroups(),
        fetchMatches().catch(() => ({ matches: [] })),
      ]);

      const teams: Team[] = teamsData.teams.map(transformApiTeam);
      const teamsMap = new Map<number, Team>(teams.map((t) => [t.id, t]));

      const groups: Group[] = groupsData.groups.map((g) =>
        transformApiGroup(g, teamsMap)
      );

      const matches = (matchesData?.matches ?? []).map((m) =>
        transformApiMatch(m, teamsMap)
      );

      const tournament = buildTournament(teams, groups, matches);
      setTournament(tournament);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err as Error);
    }
  }, []);

  return { tournament, isLoading, error, refetch, refetchMatches, lastUpdated };
}
