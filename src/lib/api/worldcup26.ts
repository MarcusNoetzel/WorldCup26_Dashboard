import type {
  ApiTeamsResponse,
  ApiGroupsResponse,
  ApiStadiumsResponse,
  ApiMatchesResponse,
} from "@/lib/types/api";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://worldcup26.ir";
const API_TIMEOUT = parseInt(
  process.env.NEXT_PUBLIC_API_TIMEOUT || "10000",
  10
);
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

async function fetchWithRetry<T>(
  url: string,
  retries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

      const response = await fetch(url, {
        signal: controller.signal,
        cache: "no-store",
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data as T;
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
      }
    }
  }

  throw lastError ?? new Error(`Failed to fetch ${url}`);
}

export async function fetchTeams(): Promise<ApiTeamsResponse> {
  return fetchWithRetry<ApiTeamsResponse>(`${API_BASE}/get/teams`);
}

export async function fetchGroups(): Promise<ApiGroupsResponse> {
  return fetchWithRetry<ApiGroupsResponse>(`${API_BASE}/get/groups`);
}

// TODO: Wire up stadium data if venue info is needed on match cards
export async function fetchStadiums(): Promise<ApiStadiumsResponse> {
  return fetchWithRetry<ApiStadiumsResponse>(`${API_BASE}/get/stadiums`);
}

export async function fetchMatches(): Promise<ApiMatchesResponse> {
  return fetchWithRetry<ApiMatchesResponse>(`${API_BASE}/get/games`);
}
