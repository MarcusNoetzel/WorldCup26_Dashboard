# Round 1 — Testing & Completeness Review

## Review

### Correct: What is already good

1. **Test suite passes** — All 3 test files, 22 tests pass without errors.
   - `tournament.test.ts`: 14 tests covering `transformApiTeam`, `transformApiGroup`, `buildBracketRounds`, `determineMatchStatus`, `getWinnerId`, `createTbdTeamInfo`.
   - `flags.test.ts`: 6 tests covering `getFlagUrl` and `getFlagUrlLarge`.
   - `championships.test.ts`: 4 tests covering `getPastChampionships`.

2. **Data files are complete and accurate**
   - `src/data/past-championships.json`: 8 entries for all known World Cup winners (BRA 5, GER 4, ITA 4, ARG 3, FRA 2, URU 2, ENG 1, ESP 1).
   - `src/data/fixtures.json`: 48 teams across all 12 groups (A–L) with standings data, plus empty knockout sections.

3. **Config files are mostly correct**
   - `tsconfig.json`: Path aliases `@/*` → `./src/*` are correct and working.
   - `next.config.ts`: `remotePatterns` for `flagcdn.com` and `worldcup26.ir` are properly configured.
   - `package.json`: All required scripts present (`dev`, `build`, `start`, `lint`, `test`, `test:watch`).
   - `tailwind.config.ts`: Custom FIFA color palette (fifa-blue, fifa-gold, fifa-green) is well-defined.

4. **SEO & Metadata (Phase 1.3) — mostly complete**
   - `layout.tsx`: Title, description, Open Graph, Twitter Card, robots, viewport all present.
   - `manifest.ts`: PWA manifest with name, short_name, start_url, display, colors, icons.
   - `robots.ts`: Rules and sitemap URL present.
   - `sitemap.ts`: Basic sitemap with root URL.

5. **Environment Configuration (Phase 1.4)**
   - `.env.local.template` has all 3 required variables: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_API_TIMEOUT`, `NEXT_PUBLIC_REVALIDATE_INTERVAL`.

6. **README.md** is comprehensive — matches the actual implementation, includes features, tech stack, getting started, project structure, known limitations, data sources, and license.

---

### Blocker

**B-1: `jest.config.js` has a typo that breaks test setup**
- **File**: `jest.config.js`, line 3
- **Issue**: `setupFilesAfterSetup` should be `setupFilesAfterEnv`
- **Evidence**: Jest outputs the warning: `Unknown option "setupFilesAfterSetup" with value ["<rootDir>/jest.setup.ts"] was found. This is probably a typing mistake.`
- **Impact**: `jest.setup.ts` (which imports `@testing-library/jest-dom`) is **not being loaded**. The tests pass only because they don't use any `@testing-library/jest-dom` matchers (e.g., `toBeInTheDocument`, `toHaveTextContent`). If any test were to use those matchers, they would fail at runtime with `matcher not found` errors.
- **Fix**: Change `setupFilesAfterSetup` to `setupFilesAfterEnv`.

---

### Fixed

_None applied during this review — see Blockers and Concerns below._

---

### Concerns / Missing Tests

#### A. Missing Tests for Utility Functions

| Function | File | Status |
|----------|------|--------|
| `buildTournament` | `tournament.ts` | ❌ Not tested |
| `getTeamById` | `tournament.ts` | ❌ Not tested |
| `transformApiTeamToInfo` | `tournament.ts` | ❌ Not tested |

#### B. Missing Component Tests

| Component | File | Status |
|-----------|------|--------|
| `GroupTable` (row color logic) | `GroupTable.tsx` | ❌ No tests |
| `ErrorBoundary` | `ErrorBoundary.tsx` | ❌ No tests |
| `GroupStandings` | `GroupStandings.tsx` | ❌ No tests |
| `TournamentBracket` | `TournamentBracket.tsx` | ❌ No tests |
| `BracketRound` | `BracketRound.tsx` | ❌ No tests |
| `BracketNode` | `BracketNode.tsx` | ❌ No tests |
| `Header` | `Header.tsx` | ❌ No tests |
| `Footer` | `Footer.tsx` | ❌ No tests |
| `LoadingSkeleton` | `LoadingSkeleton.tsx` | ❌ No tests |
| `Home` (page) | `page.tsx` | ❌ No tests |

#### C. Missing Hook Tests

| Hook | File | Status |
|------|------|--------|
| `useTournamentData` | `useTournamentData.ts` | ❌ No tests for loading/error/refetch states |

#### D. Missing Edge Cases in Existing Tests

1. **`transformApiTeam`**: No test for `iso2` being empty string (would produce `https://flagcdn.com/w40/.png`).
2. **`transformApiGroup`**: No test for all teams having identical points/GD/GF (tests the alphabetical name tiebreaker).
3. **`transformApiGroup`**: No test for a team in standings that is missing from `teamsMap` (tests the null filter path).
4. **`buildBracketRounds`**: No test with matches spanning multiple stages to verify round ordering.
5. **`getFlagUrl`**: Test labeled "returns empty string for undefined input" actually passes `""` (empty string), not `undefined`.
6. **`getFlagUrlLarge`**: No test for uppercase ISO2 codes.

---

### Concerns / Configuration Issues

#### C-1: `manifest.ts` references non-existent favicon
- **File**: `src/app/manifest.ts`, line 17
- **Issue**: `icons` array references `/favicon.ico` but no `favicon.ico` exists in `public/`.
- **Evidence**: `public/` directory is empty. `find` for `favicon*` returned nothing.
- **Impact**: PWA installation will fail or show a broken icon. Browsers will also miss the favicon entirely.

#### C-2: `NEXT_PUBLIC_REVALIDATE_INTERVAL` is unused
- **File**: `.env.local.template`, line 3
- **Issue**: The variable is defined in the template but never imported or used in `next.config.ts`, `page.tsx`, or the API client.
- **Impact**: Misleading documentation — developers will think it's active when it's not.

#### C-3: No favicon in `next.config.ts` or `metadata`
- The `next.config.ts` does not configure a favicon. The `layout.tsx` metadata does not include `icons`. The `manifest.ts` references `/favicon.ico` but the file doesn't exist.

#### C-4: `fixtures.json` structure differs from API response format
- `fixtures.json` uses a flat `teams` array and a nested `groups` object with simplified standings (only `team_id`, `pts`, `gd`, `gf`, `ga`), whereas the actual API response (per `ApiGroup` type) includes `mp`, `w`, `l`, `d`, `pts`, `gf`, `ga`, `gd`.

---

### Minor Notes

#### N-1: `BracketRound.tsx` uses magic number for TBD detection
- **File**: `src/components/bracket/BracketRound.tsx`, lines 24 and 33
- **Issue**: `match.homeTeam?.id === 0` and `match.awayTeam?.id === 0` detect TBD teams. This works because `createTbdTeamInfo` sets `id: 0`, but it's a magic number. A more explicit check (e.g., `team.code === "TBD"`) would be clearer.

#### N-2: `Home` page has a stale-data banner that never renders
- **File**: `src/app/page.tsx`, lines 57–63
- **Issue**: The condition `{tournament && error && ...}` renders a "Some data may be stale" banner, but the hook sets `error` and `tournament` in mutually exclusive states (error is cleared before tournament is set). This banner will almost never appear.

#### N-3: `LoadingSkeleton` component is exported but unused
- **File**: `src/components/shared/LoadingSkeleton.tsx`
- **Issue**: The component exists but is not imported or used anywhere in the codebase. The loading states in `GroupStandings` and `TournamentBracket` use inline skeleton divs instead.

---

## Residual Risks

| Risk | Severity | Description |
|------|----------|-------------|
| Jest setup not loading | **Blocker** | `setupFilesAfterEnv` typo means `@testing-library/jest-dom` matchers are unavailable at runtime. |
| Missing favicon | **Medium** | PWA manifest references `/favicon.ico` which doesn't exist. |
| No component tests | **Medium** | GroupTable row colors, ErrorBoundary behavior, and hook states are untested. |
| Unused env variable | **Low** | `NEXT_PUBLIC_REVALIDATE_INTERVAL` is documented but not wired up. |
| No tests for 3 utilities | **Low** | `buildTournament`, `getTeamById`, `transformApiTeamToInfo` have no coverage. |
