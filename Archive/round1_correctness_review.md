# Round 1 — Correctness Review (Implementation)

**Reviewed:** Implementation source code (all files under `src/`)
**Baseline:** `tasks.md` plan
**Reviewer:** Correctness & Architecture subagent
**Date:** 2026-06-21

---

## 1. API Layer (Phase 2)

### 1.1 Endpoint Coverage

| Endpoint | Implemented? | File | Line |
|----------|-------------|------|------|
| `fetchTeams()` | ✅ Yes | `src/lib/api/worldcup26.ts` | 49–50 |
| `fetchGroups()` | ✅ Yes | `src/lib/api/worldcup26.ts` | 52–53 |
| `fetchStadiums()` | ✅ Yes | `src/lib/api/worldcup26.ts` | 55–56 |
| `fetchMatches()` | ❌ **MISSING** | — | — |

**Blocker:** `fetchMatches()` is **not implemented**. The `tasks.md` Phase 2.2 explicitly requires `fetchMatches()` — GET `/get/games`. The API client only exports `fetchTeams`, `fetchGroups`, and `fetchStadiums`. The `src/hooks/useTournamentData.ts` imports only `fetchTeams` and `fetchGroups` (line 9), and passes an empty array `[]` to `buildTournament()` (line 58). This means **no match data is ever fetched**, and the knockout bracket will always be empty regardless of whether the API returns matches.

### 1.2 Retry Logic

**Correct.** `fetchWithRetry<T>()` (lines 19–48) implements:
- ✅ Max retries: `MAX_RETRIES = 2` (line 11)
- ✅ Delay between retries: `RETRY_DELAY = 1000` (line 12)
- ✅ AbortController for timeout (lines 24–25)
- ✅ Timeout: `API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000", 10)` (lines 7–9) — 10 seconds, matching `.env.local`
- ✅ `cache: "no-store"` to bypass Next.js cache (line 29) — important for client-side fetch

### 1.3 Error Handling

**Adequate but incomplete.** The retry function:
- ✅ Catches HTTP errors and network errors
- ✅ Throws the last error after retries exhausted (line 47)
- ⚠️ Does not distinguish between timeout errors and network errors — they are treated identically
- ✅ The hook (`useTournamentData.ts` line 59) catches errors and sets `error` state
- ❌ No response schema validation — `data as T` (line 38) silently accepts malformed API responses

### 1.4 Type Definitions vs. Actual API Schema

**File:** `src/lib/types/api.ts`

| Field | API Response (verified) | ApiTeam | Match? |
|-------|------------------------|---------|--------|
| `_id` | string (MongoDB ObjectId) | ✅ `_id: string` | ✅ |
| `name_en` | string | ✅ `name_en: string` | ✅ |
| `name_fa` | string | ✅ `name_fa: string` | ✅ |
| `flag` | string (flagcdn.com URL) | ✅ `flag: string` | ✅ |
| `fifa_code` | string | ✅ `fifa_code: string` | ✅ |
| `iso2` | string (lowercase) | ✅ `iso2: string` | ✅ |
| `groups` | string (e.g., "C") | ✅ `groups: string` | ✅ |
| `id` | string (numeric) | ✅ `id: string` | ✅ |

**ApiGroup fields:**
| Field | API Response (verified) | ApiGroup | Match? |
|-------|------------------------|----------|--------|
| `_id` | string | ✅ `_id: string` | ✅ |
| `name` | string (e.g., "A") | ✅ `name: string` | ✅ |
| `teams` | `ApiTeamStanding[]` | ✅ `teams: ApiTeamStanding[]` | ✅ |
| `createdAt` | string | ✅ `createdAt: string` | ✅ |
| `__v` | number | ✅ `__v: number` | ✅ |

**ApiTeamStanding fields:**
| Field | API Response | ApiTeamStanding | Match? |
|-------|-------------|-----------------|--------|
| `team_id` | string | ✅ `team_id: string` | ✅ |
| `mp` | string | ✅ `mp: string` | ✅ |
| `w` | string | ✅ `w: string` | ✅ |
| `l` | string | ✅ `l: string` | ✅ |
| `d` | string | ✅ `d: string` | ✅ |
| `pts` | string | ✅ `pts: string` | ✅ |
| `gf` | string | ✅ `gf: string` | ✅ |
| `ga` | string | ✅ `ga: string` | ✅ |
| `gd` | string | ✅ `gd: string` | ✅ |
| `_id` | string | ✅ `_id: string` | ✅ |

**Verdict:** Type definitions are **accurate** and match the actual API response schema.

---

## 2. Data Transformation (Phase 2.3)

### 2.1 `transformApiTeam` — Field Mapping

**File:** `src/lib/utils/tournament.ts`, lines 27–38

| Internal Field | Source | Correct? |
|---------------|--------|----------|
| `id` | `parseInt(apiTeam.id, 10)` | ✅ Correct — converts string ID to number |
| `name` | `apiTeam.name_en` | ✅ Correct |
| `code` | `apiTeam.fifa_code` | ✅ Correct |
| `iso2` | `apiTeam.iso2` | ✅ Correct |
| `flag` | `apiTeam.flag` with flagcdn fallback | ✅ Correct — uses `iso2.toLowerCase()` for URL |
| `pastChampionships` | `getPastChampionships(apiTeam.fifa_code)` | ✅ Correct |
| `group` | `apiTeam.groups` | ✅ Correct |

**Correct.** All 7 fields map correctly. The flag fallback correctly lowercases the ISO2 code for the flagcdn URL.

### 2.2 `transformApiGroup` — Sorting and Tiebreakers

**File:** `src/lib/utils/tournament.ts`, lines 53–90

**Sorting logic (lines 71–74):**
```typescript
standings.sort((a, b) => {
  if (b.points !== a.points) return b.points - a.points;
  if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
  if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
  return a.team.name.localeCompare(b.team.name);
});
```

**Assessment:**
- ✅ Step 1: Points — implemented
- ✅ Step 2: Goal Difference — implemented
- ✅ Step 3: Goals For — implemented
- ❌ **Steps 4–8 NOT implemented:** The `tasks.md` Phase 6.2 requires all 8 FIFA tiebreaker steps:
  - Step 4: Points in matches between tied teams — **NOT implemented**
  - Step 5: GD in matches between tied teams — **NOT implemented**
  - Step 6: GF in matches between tied teams — **NOT implemented**
  - Step 7: Fair play conduct — **NOT implemented** (requires yellow/red card data)
  - Step 8: Drawing of lots — **NOT implemented**

**Impact:** For the current implementation (where group data comes from the API's pre-computed standings), this is **low risk** because the API likely already applies the full tiebreaker chain. However, if the app later computes standings from match data (as suggested in round 1 completeness review, Suggestion 3), the incomplete tiebreaker logic will produce **incorrect standings** in edge cases where teams are tied on points/GD/GF.

**Note:** The fallback `a.team.name.localeCompare(b.team.name)` is not a FIFA tiebreaker — it's an arbitrary alphabetical tiebreaker. FIFA does not use alphabetical order as a tiebreaker. This is **incorrect per FIFA rules** but acceptable as a deterministic last resort for development purposes.

### 2.3 `buildBracketRounds` — Stage Coverage

**File:** `src/lib/utils/tournament.ts`, lines 98–119

**Stages included in `stageOrder`:**
- ✅ `round_of_32` → "Round of 32"
- ✅ `quarterfinals` → "Quarterfinals"
- ✅ `semifinals` → "Semifinals"
- ✅ `final` → "Final"
- ✅ `third_place` → "Third Place"

**Correct.** All 5 knockout stages are present. The order is correct (R32 → QF → SF → Final → Third Place).

### 2.4 `createTbdTeamInfo` — Placeholder Teams

**File:** `src/lib/utils/tournament.ts`, lines 138–143

```typescript
export function createTbdTeamInfo(): TeamInfo {
  return {
    id: 0,
    name: "TBD",
    code: "TBD",
    iso2: "",
    flag: "",
  };
}
```

**Assessment:**
- ✅ Creates a valid `TeamInfo` with `id: 0` (matching the API's placeholder convention)
- ✅ Name is "TBD" — matches the plan's requirement
- ⚠️ **Missing `team_label` fallback:** The plan (Phase 5.3) specifies rendering "TBD with `team_label` as fallback text." The API returns knockout matches with `home_team_label`/`away_team_label` (e.g., "Winner Match 74"). This `createTbdTeamInfo()` function does not accept a label parameter, so the fallback text is lost.
- ⚠️ No flag URL fallback for TBD teams — the `BracketNode` component will show no flag (which is correct for TBD), but the code path is fragile if a real team with `id: 0` were ever returned.

---

## 3. Tournament Bracket (Phase 5)

### 3.1 `buildBracketRounds` — Implementation Gap

**File:** `src/lib/utils/tournament.ts`, lines 98–119

The function **only filters matches by stage** — it does not implement the 48-team knockout qualification algorithm. The `tasks.md` Phase 5.3 requires:
1. Rank all 12 groups by FIFA tiebreaker rules
2. Select top 2 from each group (24 teams)
3. Rank all 12 third-placed teams against each other
4. Select top 4 third-place teams
5. Map qualifying teams to R32 bracket slots per FIFA pairing rules
6. Handle `team_id: 0` placeholders

**Current implementation only does step 6** (indirectly — it passes through whatever matches the API returns). Steps 1–5 are **not implemented**.

**Impact:** If the API returns knockout matches with `team_id: 0` placeholders and label text, the bracket will render TBD placeholders correctly. But if the API returns no knockout matches (or the wrong ones), the app has no logic to construct the bracket from group standings.

### 3.2 Bracket Rendering Components

**`TournamentBracket.tsx`** (lines 1–55):
- ✅ Loading skeleton with pulsing placeholders
- ✅ Empty state with message when no rounds
- ✅ Iterates over rounds and renders `BracketRound` for each
- ⚠️ No horizontal scroll container for mobile (plan Phase 5.3 requires "scrollable container for mobile")

**`BracketRound.tsx`** (lines 1-48):
- ✅ Renders matches in a column (`flex flex-col gap-4`)
- ✅ Uses `BracketNode` for each team
- ✅ Determines winner highlighting
- ⚠️ **No SVG connector lines** — plan Phase 5.4 requires SVG connectors between rounds. The current implementation has no connectors between rounds or between nodes.

**`BracketNode.tsx`** (lines 1-86):
- ✅ Flag image with `next/image` and lazy loading
- ✅ Past championship count display
- ✅ Winner highlighting (gold background/border)
- ✅ TBD state (dashed border, gray background)
- ✅ Score display
- ✅ Status indicator (green pulse for in_progress)
- ✅ `onError` handler for flag image
- ✅ ARIA label
- ✅ Fallback flag URL via `getFlagUrl()`
- ✅ Fallback placeholder "?" when no flag

**Correct.** The bracket node component is well-implemented and handles all edge cases.

---

## 4. Hooks (Phase 7)

### 4.1 `useTournamentData` — `refetch()`

**File:** `src/hooks/useTournamentData.ts`

- ✅ `refetch()` function exists (lines 62–64)
- ✅ Uses `AbortController` to cancel previous requests (lines 37–41)
- ✅ Parallel fetch of teams and groups (line 49)
- ✅ Error handling with AbortError filtering (line 59)

**Correct.**

### 4.2 `refetchMatches()` — ❌ MISSING

**File:** `src/hooks/useTournamentData.ts`

The `tasks.md` Phase 7.1 explicitly requires:
> "Provide `refetchMatches()` method for auto-refresh toggle (debounced, min 10s between calls)"

**The hook does NOT have a `refetchMatches()` method.** It only has `refetch()` which fetches everything (teams + groups). There is no separate match-fetching method.

**Impact:** Without `fetchMatches()` (which is itself missing from the API layer), there is no match data to refetch. The auto-refresh toggle in `page.tsx` calls `refetch()` which only refreshes teams and groups — not matches. This is a cascading gap: no `fetchMatches()` → no match data → no `refetchMatches()`.

### 4.3 Auto-Refresh / Debounce

**File:** `src/app/page.tsx`, lines 17–34

The page implements auto-refresh with a **60-second interval** (not debounced):
```typescript
setRefreshCountdown(60);
const interval = setInterval(() => {
  setRefreshCountdown((prev) => {
    if (prev <= 1) {
      refetch();
      return 60;
    }
    return prev - 1;
  });
}, 1000);
```

**Assessment:**
- ✅ Auto-refresh toggle exists
- ✅ Countdown display
- ⚠️ **Not debounced** — plan says "debounced, min 10s between calls." The current implementation uses a fixed 60-second interval, not a debounce. This means rapid toggle-on/toggle-off cycles don't cause issues (the interval is cleared on unmount), but there's no explicit debounce guard.
- ✅ Countdown resets to 60 after each refresh
- ⚠️ The `refetch()` call in the interval does not check if a previous fetch is still in flight — it could trigger concurrent requests. The `AbortController` in the hook mitigates this, but the UI doesn't show a loading state for auto-refresh specifically.

---

## 5. Page (Phase 8)

### 5.1 SSR Client Component Wrapper

**File:** `src/app/page.tsx`

**❌ The page is a pure client component (`"use client"` at line 1).** The `tasks.md` Phase 8.1 requires:
> "Server component for initial data fetching (SSR)"
> "Client component wrapper for live refresh capability"

**Current implementation:** All data fetching happens in the client-side `useTournamentData` hook. There is **no server-side data fetching**. The plan specifies using `revalidate: 60` in server components for initial data, but the page is entirely client-side.

**Impact:** 
- No SSR — the page will show a blank screen until the API responds
- No SEO benefit from server-rendered content
- Slower Time to Interactive (TTI) because the client must fetch all data before rendering anything
- The `revalidate` option in `fetchWithRetry` is set to `"no-store"` (line 29 of `worldcup26.ts`), which bypasses Next.js ISR — confirming there is no server-side caching

### 5.2 Error States

**File:** `src/app/page.tsx`, lines 39–56

- ✅ Error state with retry button (lines 39–56)
- ✅ User-friendly error message
- ✅ `ErrorBoundary` component wrapping the content (line 34)
- ✅ ErrorBoundary has its own retry mechanism (line 34)

**Correct.**

### 5.3 Loading States

**File:** `src/app/page.tsx` and components

- ✅ Loading skeleton for group standings (in `GroupStandings.tsx`)
- ✅ Loading skeleton for bracket (in `TournamentBracket.tsx`)
- ✅ Spinner icon on refresh button when loading
- ⚠️ **No loading state for the entire page** — individual components show skeletons, but there's no global "loading" overlay

### 5.4 Stale Data Banner

**File:** `src/app/page.tsx`, lines 58–64

```typescript
{tournament && error && (
  <div className="...">
    ⚠️ Some data may be stale. Showing last available data.
  </div>
)}
```

- ✅ Stale data banner exists
- ⚠️ **Logic issue:** The banner only shows when `tournament` exists AND `error` exists simultaneously. But the hook's `finally` block sets `isLoading(false)` and the error state is only set when fetch fails. If the fetch fails after a successful initial load, the stale banner will show — which is correct. However, if the initial fetch fails entirely, `tournament` will be `null` and the banner won't show. This is a minor edge case.

### 5.5 Refresh Button

**File:** `src/app/page.tsx`, lines 83–93

- ✅ Refresh button exists
- ✅ Disabled state when loading
- ✅ Spinner animation when loading
- ✅ Resets countdown if auto-refresh is enabled

**Correct.**

### 5.6 Auto-Refresh Toggle

**File:** `src/app/page.tsx`, lines 95–110

- ✅ Auto-refresh toggle exists
- ✅ Visual state (green when on, gray when off)
- ✅ Countdown display
- ✅ ARIA labels

**Correct.**

---

## 6. Other Observations

### 6.1 `fetchMatches()` — The Root Gap

**File:** `src/lib/api/worldcup26.ts`

The `tasks.md` Phase 2.2 requires `fetchMatches()` — GET `/get/games`. This function does not exist in the API client. Without it:
- No match data is ever fetched
- The knockout bracket is always empty
- The `refetchMatches()` hook method is meaningless
- The tournament is incomplete

**This is a critical blocker.** The entire knockout bracket feature depends on match data, which is never fetched.

### 6.2 `fixtures.json` — Static Data

**File:** `src/data/fixtures.json`

The file exists and contains:
- 48 teams with FIFA codes and groups
- Group standings with scores
- Empty knockout arrays

**Correct.** This matches the plan Phase 9.5. However, the fixtures are **never loaded** by the application — they are purely a developer resource. There is no code path that falls back to fixtures when the API is unavailable.

### 6.3 `past-championships.json` — Data Completeness

**File:** `src/data/past-championships.json`

Contains only 8 entries: BRA(5), GER(4), ITA(4), ARG(3), FRA(2), URU(2), ENG(1), ESP(1).

The `tasks.md` Phase 3.2 says:
> "all other teams: 0"

The `getPastChampionships()` function correctly returns 0 for missing codes (line 22 of `tournament.ts`). This is **acceptable** — the lookup table doesn't need to enumerate all 48 teams if the fallback is zero.

### 6.4 Tests

**File:** `src/__tests__/` — 3 test files, 22 tests, all passing.

- ✅ `championships.test.ts` — 3 tests for `getPastChampionships()`
- ✅ `flags.test.ts` — 5 tests for `getFlagUrl()` and `getFlagUrlLarge()`
- ✅ `tournament.test.ts` — 14 tests for `transformApiTeam`, `transformApiGroup`, `buildBracketRounds`, `determineMatchStatus`, `getWinnerId`, `createTbdTeamInfo`

**Coverage gaps:**
- ❌ No tests for `fetchWithRetry()` retry logic
- ❌ No tests for `fetchTeams()`, `fetchGroups()`, `fetchStadiums()` network behavior
- ❌ No tests for `transformApiTeamToInfo()`
- ❌ No tests for `buildTournament()`
- ❌ No tests for `getTeamById()`
- ❌ No tests for `getFlagUrlLarge()` beyond basic

### 6.5 `next.config.ts` — Image Optimization

**File:** `next.config.ts`

- ✅ `remotePatterns` configured for `flagcdn.com` and `worldcup26.ir`
- ✅ Proper protocol, hostname, and pathname configuration

**Correct.**

### 6.6 SEO / Metadata

**File:** `src/app/layout.tsx`

- ✅ `<title>` and `<meta description>`
- ✅ Open Graph meta tags
- ✅ Twitter Card meta tags
- ✅ `robots: { index: true, follow: true }`

**File:** `src/app/manifest.ts` — exists (PWA support)
**File:** `src/app/robots.ts` — exists
**File:** `src/app/sitemap.ts` — exists

**Correct.** All SEO requirements from Phase 1.3 are implemented.

### 6.7 Environment Configuration

**File:** `.env.local`

```
NEXT_PUBLIC_API_BASE_URL=https://worldcup26.ir
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_REVALIDATE_INTERVAL=60
```

**Correct.** Matches `.env.local.template` structure from the plan.

---

## Summary of Findings

### Blocker

| # | Issue | Location | Impact |
|---|-------|----------|--------|
| **B1** | `fetchMatches()` is NOT implemented — the API client only exports `fetchTeams`, `fetchGroups`, `fetchStadiums` | `src/lib/api/worldcup26.ts` | **Critical** — no match data is ever fetched. The knockout bracket will always be empty. |
| **B2** | No server-side data fetching — `page.tsx` is a pure client component with no SSR | `src/app/page.tsx` line 1 | **High** — no initial data rendering, slower TTI, no SEO benefit from server content |
| **B3** | `refetchMatches()` hook method is NOT implemented | `src/hooks/useTournamentData.ts` | **Medium** — auto-refresh cannot refetch matches independently |

### Notes

| # | Issue | Location | Severity |
|---|-------|----------|----------|
| N1 | Tiebreaker only implements 3 of 8 FIFA steps (points, GD, GF) | `src/lib/utils/tournament.ts` lines 71–74 | **Medium** — incorrect for edge cases if standings are computed from match data |
| N2 | Alphabetical name comparison used as final tiebreaker — not a FIFA rule | `src/lib/utils/tournament.ts` line 74 | **Low** — acceptable for dev, incorrect per FIFA rules |
| N3 | `createTbdTeamInfo()` does not accept a `team_label` for fallback text | `src/lib/utils/tournament.ts` lines 138–143 | **Low** — TBD text is correct but label info is lost |
| N4 | Auto-refresh is interval-based, not debounced as specified | `src/app/page.tsx` lines 17–34 | **Low** — functional but doesn't match spec |
| N5 | Stale data banner only shows when both `tournament` and `error` are truthy | `src/app/page.tsx` lines 58–64 | **Low** — edge case: initial fetch failure won't show banner |
| N6 | No tests for retry logic or API client network behavior | `src/__tests__/` | **Low** — test coverage gap |
| N7 | `fixtures.json` exists but is never loaded as a fallback | `src/data/fixtures.json` | **Low** — dead resource |
| N8 | No horizontal scroll container for bracket on mobile | `src/components/bracket/TournamentBracket.tsx` | **Low** — plan requires it |

### Correct (What Works Well)

1. **Type definitions match the API schema** — all fields in `ApiTeam`, `ApiGroup`, `ApiTeamStanding` are accurate
2. **`transformApiTeam` correctly maps all 7 fields** — including flag fallback to flagcdn.com
3. **`transformApiGroup` correctly sorts by the first 3 tiebreaker steps** (points → GD → GF)
4. **`buildBracketRounds` includes all 5 knockout stages** in correct order
5. **`createTbdTeamInfo` creates valid placeholders** with `id: 0` matching API convention
6. **`useTournamentData` has `refetch()`** with AbortController for cancellation
7. **`BracketNode` handles all edge cases** — flags, TBD, winners, scores, status
8. **`ErrorBoundary` is properly implemented** with retry
9. **SEO metadata is complete** — title, description, OG, Twitter, manifest, robots, sitemap
10. **Tests pass** — 22 tests across 3 files, all passing
11. **Retry logic is correct** — max 2 retries, 1s delay, timeout via AbortController
12. **Past championship lookup correctly returns 0 for missing codes**
13. **Tailwind config has FIFA palette** — fifa-blue, fifa-gold, fifa-green with full shade range
14. **next.config.ts correctly allows remote images** from flagcdn.com and worldcup26.ir

---

**Review complete.**
