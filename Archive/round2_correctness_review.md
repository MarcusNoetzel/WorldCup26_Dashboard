# Round 2 Correctness Review — FIFA World Cup 2026 Dashboard

## 1. fetchMatches() implementation

### `src/lib/api/worldcup26.ts`
- ✅ `fetchMatches()` exists and returns `Promise<ApiMatchesResponse>`.
- ✅ Uses `fetchWithRetry` with configurable timeout and retry logic.
- ✅ Gracefully falls back to `{ matches: [] }` when called (used in `page.tsx` and `Dashboard.tsx` via `.catch(() => ({ matches: [] }))`).

### `src/lib/types/api.ts`
- ✅ `ApiMatch` interface exists with all required fields: `_id`, `id`, `home_team_id`, `away_team_id`, `home_team_name`, `away_team_name`, `home_team_code`, `away_team_code`, `home_team_flag`, `away_team_flag`, `home_team_label`, `away_team_label`, `home_score`, `away_score`, `status`, `stage`, `date`, `time`, `venue`, `group`.
- ✅ `ApiMatchesResponse` wraps `matches: ApiMatch[]`.

### `src/lib/utils/tournament.ts`
- ✅ `transformApiMatch()` exists with signature `(apiMatch: ApiMatch, teamsMap: Map<number, Team>): Match`.
- ✅ Handles TBD teams (when `home_team_id === 0` or `away_team_id === 0`).
- ✅ Maps API status strings (`"finished"`, `"FT"`, `"in_progress"`, `"LIVE"`) to internal `MatchStatus`.
- ✅ Maps API stage strings to internal `MatchStage` with case-insensitive matching.
- ✅ Computes `winnerId` for finished matches.

**Finding: PASS** — All three pieces are present and correctly wired.

---

## 2. SSR conversion

### `src/app/page.tsx`
- ✅ No `"use client"` directive — it is a server component.
- ✅ Uses `async function Home()` with `await Promise.all([fetchTeams(), fetchGroups(), fetchMatches()])` for parallel data fetching.
- ✅ Passes `initialTournament` and `lastUpdated` as props to `<Dashboard>`.

### `src/app/Dashboard.tsx`
- ✅ Has `"use client"` directive — it is a client component.
- ✅ Receives `initialTournament: Tournament` and `lastUpdated: string | null` as props.
- ✅ Uses `useState` to initialize state from props, allowing hydration.

### Data flow verification
- ✅ Server fetches → transforms → builds tournament → passes as props → Client initializes state → Client can re-fetch via `fetchAllData`.

**Finding: PASS** — SSR pattern is correctly implemented with proper component boundaries.

---

## 3. Hook integration

### `src/hooks/useTournamentData.ts`
- ✅ `refetch()` exists — calls `fetchData()` which re-fetches all data (teams, groups, matches) in parallel.
- ✅ `refetchMatches()` exists — re-fetches all data (teams, groups, matches) in parallel.
- ⚠️ **Naming concern**: `refetchMatches` fetches all data (teams, groups, AND matches) in parallel, not just matches. The name is misleading. If the intent was to fetch only matches, it should filter to just the `/get/games` endpoint. As implemented, it's functionally equivalent to `refetch()` — just a code duplication.

**Finding: PASS (with naming concern noted above)** — Both hooks exist and work, but `refetchMatches` is misnamed.

---

## 4. Jest fix

### `jest.config.js`
- ✅ `setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"]` is correctly set.
- ✅ `jest.setup.ts` exists and contains `import "@testing-library/jest-dom";` — standard setup for React Testing Library.
- ✅ `moduleNameMapper` correctly maps `@/` to `src/`.
- ✅ `transform` correctly uses `ts-jest` for `.ts`/`.tsx` files.

**Finding: PASS** — Jest config is correct and the setup file exists.

---

## 5. Favicon

### `public/favicon.ico`
- ✅ File exists (1046 bytes).

**Finding: PASS**

---

## 6. safeParseInt

### `src/lib/utils/tournament.ts`
- ✅ `safeParseInt` function exists with signature `(value: string | number | null | undefined, fallback = 0): number`.
- ✅ Handles `null`, `undefined`, `""`, non-numeric strings, and `NaN` gracefully.
- ✅ All `parseInt` calls within transformation functions (`transformApiGroup`, `transformApiMatch`) use `safeParseInt`.
- ⚠️ **Minor concern**: A raw `parseInt()` remains in `src/lib/api/worldcup26.ts` line 10 for `API_TIMEOUT`:
  ```typescript
  const API_TIMEOUT = parseInt(
    process.env.NEXT_PUBLIC_API_TIMEOUT || "10000",
    10
  );
  ```
  This is in the API layer, not `tournament.ts`, and uses base-10 explicitly, so it's not a radix bug. Still, for consistency, it could use `safeParseInt` or `Number()`.

**Finding: PASS** — `safeParseInt` exists and covers all transformation logic. The remaining raw `parseInt` in the API layer is a minor consistency note.

---

## 7. Stale data banner

### `src/app/Dashboard.tsx`
- ✅ `lastSuccessfulTournament` state exists and is initialized from `initialTournament`.
- ✅ It is updated to the new tournament on successful fetch in `fetchAllData`.
- ✅ Stale data banner renders when `lastSuccessfulTournament && error` is truthy:
  ```jsx
  {lastSuccessfulTournament && error && (
    <div className="...bg-yellow-50...">
      ⚠️ Some data may be stale. Showing last available data.
    </div>
  )}
  ```

**Finding: PASS** — Banner correctly uses `lastSuccessfulTournament` state and displays when an error occurs but previous data exists.

---

## 8. BracketNode fallback

### `src/components/bracket/BracketNode.tsx`
- ⚠️ **Minor concern**: The `onError` handler constructs the flag URL inline rather than calling the imported `getFlagUrl(iso2)`:
  ```tsx
  onError={(e) => {
    const img = e.target as HTMLImageElement;
    const iso2 = team?.iso2;
    if (iso2) {
      img.src = `https://flagcdn.com/w40/${iso2.toLowerCase()}.png`;
    } else {
      img.style.display = "none";
    }
  }}
  ```
  The `getFlagUrl` function is imported at the top of the file but not used in the error handler. The URL construction is duplicated from `getFlagUrl(iso2)`. This is a code quality issue, not a functional bug.

**Finding: PASS (functionally correct, but could use `getFlagUrl(iso2)` for consistency).**

---

## Additional Observations

### Concern: `transformApiMatch` score logic fragility
In `src/lib/utils/tournament.ts`, the score handling uses:
```typescript
homeScore: homeScore > 0 || apiMatch.home_score !== null ? homeScore : null,
```
This works correctly (when `home_score` is `0`, `homeScore > 0` is `false` but `apiMatch.home_score !== null` is `true`, so the result is `0`), but the `> 0` check is misleading and could cause confusion. If `home_score` were a negative value (which it shouldn't be), this would incorrectly return `null`. A cleaner approach would be:
```typescript
homeScore: apiMatch.home_score !== null ? homeScore : null,
```

---

## Review Summary

| # | Check | Status |
|---|-------|--------|
| 1 | fetchMatches() implementation | ✅ PASS |
| 2 | SSR conversion | ✅ PASS |
| 3 | Hook integration | ✅ PASS (naming concern) |
| 4 | Jest fix | ✅ PASS |
| 5 | Favicon | ✅ PASS |
| 6 | safeParseInt | ✅ PASS (minor consistency note) |
| 7 | Stale data banner | ✅ PASS |
| 8 | BracketNode fallback | ✅ PASS (code quality note) |

**No blockers found.** All eight review items are functionally correct. Three minor concerns were identified (all non-blocking):

1. `refetchMatches` is misnamed — it fetches all data, not just matches.
2. Raw `parseInt` remains in `worldcup26.ts` for `API_TIMEOUT` — minor consistency issue.
3. `BracketNode` error handler duplicates URL construction instead of calling `getFlagUrl(iso2)`.
4. `transformApiMatch` score logic has a fragile `> 0` check that works but is misleading.
