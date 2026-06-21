"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Tournament } from "@/lib/types/tournament";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import GroupStandings from "@/components/groups/GroupStandings";
import TournamentBracket from "@/components/bracket/TournamentBracket";
import ErrorBoundary from "@/components/shared/ErrorBoundary";
import { fetchTeams, fetchGroups, fetchMatches } from "@/lib/api/worldcup26";
import {
  transformApiTeam,
  transformApiGroup,
  transformApiMatch,
  buildTournament,
} from "@/lib/utils/tournament";

interface DashboardProps {
  initialTournament: Tournament;
  lastUpdated: string | null;
}

export default function Dashboard({
  initialTournament,
  lastUpdated: initialLastUpdated,
}: DashboardProps) {
  const [tournament, setTournament] = useState<Tournament | null>(
    initialTournament
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSuccessfulTournament, setLastSuccessfulTournament] =
    useState<Tournament | null>(initialTournament);
  const [lastUpdated, setLastUpdated] = useState<string | null>(
    initialLastUpdated
  );
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshCountdown, setRefreshCountdown] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchAllData = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const [teamsData, groupsData, matchesData] = await Promise.all([
        fetchTeams(),
        fetchGroups(),
        fetchMatches().catch(() => ({ matches: [] })),
      ]);

      const teams = teamsData.teams.map(transformApiTeam);
      const teamsMap = new Map<number, typeof teams[number]>(
        teams.map((t) => [t.id, t])
      );

      const groups = groupsData.groups.map((g) =>
        transformApiGroup(g, teamsMap)
      );
      const matches = (matchesData?.matches ?? []).map((m) =>
        transformApiMatch(m, teamsMap)
      );

      const newTournament = buildTournament(teams, groups, matches);
      setTournament(newTournament);
      setLastSuccessfulTournament(newTournament);
      setLastUpdated(new Date().toISOString());
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Auto-refresh countdown
  useEffect(() => {
    if (!autoRefresh) {
      setRefreshCountdown(0);
      return;
    }

    setRefreshCountdown(60);
    const interval = setInterval(() => {
      setRefreshCountdown((prev) => {
        if (prev <= 1) {
          fetchAllData();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchAllData]);

  const handleRefresh = useCallback(async () => {
    await fetchAllData();
    if (autoRefresh) {
      setRefreshCountdown(60);
    }
  }, [fetchAllData, autoRefresh]);

  const hasGroups = tournament && tournament.groups.length > 0;

  return (
    <div className="min-h-screen flex flex-col">
      <Header lastUpdated={lastUpdated} />

      <main className="flex-1">
        <ErrorBoundary>
          {/* Error state */}
          {error && (
            <div className="max-w-md mx-auto px-4 py-8 text-center">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="text-3xl mb-3">⚠️</div>
                <h2 className="text-lg font-semibold text-red-800 mb-2">
                  Failed to load tournament data
                </h2>
                <p className="text-red-600 text-sm mb-4">
                  {error.message}
                </p>
                <button
                  onClick={handleRefresh}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Stale data banner — shows when last fetch failed but we have previous data */}
          {lastSuccessfulTournament && error && (
            <div className="max-w-7xl mx-auto px-4 py-2">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2 text-center text-sm text-yellow-700">
                ⚠️ Some data may be stale. Showing last available data.
              </div>
            </div>
          )}

          {/* Empty state — no groups loaded */}
          {!isLoading && !error && !hasGroups && (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
              <div className="text-4xl mb-4">📋</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                Group Stage Standings
              </h2>
              <p className="text-gray-500">
                Group data is not available yet. Check back after the group
                stage begins.
              </p>
            </div>
          )}

          {/* Group Standings */}
          {hasGroups && (
            <section id="groups" aria-label="Group Stage Standings">
              <GroupStandings
                groups={tournament?.groups ?? []}
                isLoading={isLoading}
              />
            </section>
          )}

          {/* Tournament Bracket */}
          <section id="bracket" aria-label="Knockout Stage Bracket">
            <TournamentBracket
              rounds={tournament?.rounds ?? []}
              isLoading={isLoading}
            />
          </section>
        </ErrorBoundary>
      </main>

      {/* Refresh controls */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center gap-2 bg-fifa-blue-600 text-white px-4 py-2 rounded-lg hover:bg-fifa-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Refresh tournament data"
          >
            <span className={`text-lg ${isLoading ? "animate-spin" : ""}`}>
              🔄
            </span>
            <span className="text-sm font-medium">Refresh</span>
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              autoRefresh
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-gray-100 text-gray-600 border border-gray-300 hover:bg-gray-200"
            }`}
            aria-label={autoRefresh ? "Disable auto-refresh" : "Enable auto-refresh"}
          >
            <span className="text-lg">⏱️</span>
            <span>
              Auto-refresh
              {autoRefresh && refreshCountdown > 0 && (
                <span className="ml-1 text-xs">({refreshCountdown}s)</span>
              )}
            </span>
          </button>
        </div>
      </div>

      <Footer />
    </div>
  );
}
