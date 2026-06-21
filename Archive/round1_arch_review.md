# Round 1 — Architecture Review

**File reviewed:** `tasks.md`
**Reviewer:** Architecture subagent
**Date:** 2026-06-21

---

## 1. Tech Stack Appropriateness

### Correct
- **Next.js 15+ App Router + TypeScript + Tailwind CSS** is well-suited for a data-driven dashboard that needs SSR, fast initial load, and responsive layouts. The App Router's built-in server components align with the stated data-fetching model.
- **No database** is correct — all data comes from public APIs and is ephemeral (tournament data).
- **`revalidate: 60`** (Phase 5.2, Phase 10) is appropriate for tournament data that changes during the event but doesn't need millisecond-level freshness.

### Concern
- **Tailwind CSS** is fine for this scope, but the bracket connector lines (Phase 5.4) require precise SVG positioning. Tailwind's utility-first approach may struggle with dynamic SVG coordinate calculations. The task should explicitly call for a custom SVG component or a library like `react-flow` / `d3` rather than CSS-only connectors, which will break on responsive layouts.
  - *Recommendation:* Use inline SVG with computed coordinates rather than CSS borders/pseudo-elements for connector lines.

---

## 2. Data Flow Decisions

### Correct
- **SSR with `revalidate: 60`** is the right choice. The tournament data changes during matches, so static generation would be stale too quickly, and client-side-only would hurt initial load and SEO.
- **No WebSocket** is correct per requirements (Phase 11.1 explicitly notes "live updates are on refresh only").
- **Server-to-client handoff** via hooks (`useTournamentData`, `useMatchResults`) is standard Next.js pattern.

### Blocker — Data flow gap: two incompatible API schemas
- **Phase 2.2** describes the primary API (worldcup26.ir) with endpoints `/get/teams`, `/get/games`, `/get/groups`, `/get/stadiums`.
- **Phase 2.3** describes the fallback API (football-data.org) with endpoints `/v4/competitions/WS/matches` and `/v4/teams/{id}`.
- **These two APIs have fundamentally different data models.** football-data.org is a generic football data API (designed for league competitions); worldcup26.ir is a tournament-specific API. The transformation layer (Phase 2.4) must normalize both into the same `Team`/`Match`/`Group` types, but this is never specified.
- **Critical risk:** football-data.org's `/v4/competitions/WS/matches` endpoint uses a different schema (e.g., `homeTeam.name` vs `homeTeam.code`, different status enums, different date formats). If the fallback is triggered, the existing transformation logic will silently produce incorrect data.
  - *Recommendation:* Either (a) add a normalization adapter for each API in Phase 2.4, or (b) simplify the fallback to only provide team info (flags, names) while using worldcup26.ir for bracket structure, or (c) drop football-data.org as a full fallback and use it only as a supplementary data source.

### Concern — API key dependency
- football-data.org requires a paid API key for full access (Phase 2.3 mentions `.env` variable). The free tier is rate-limited (10 req/min). If the primary API fails and the fallback is triggered, rate limits could cause cascading failures.
  - *Recommendation:* Document the API key requirement prominently. Add rate-limit awareness to the fallback client.

---

## 3. 48-Team Bracket Structure

### Correct
- **12 groups (A–L), Round of 32 → QF → SF → Final** correctly describes the FIFA World Cup 2026 format (Phase 5.3, Phase 1).
- **Top 2 from each group + 4 best 3rd-place teams** is the correct advancement rule (Phase 6.1).

### Blocker — "Best 4 third-place teams" selection logic is underspecified
- **Phase 6.1** mentions "highlight top teams advancing to knockout stage (typically top 2 + 4 best 3rd-place)" but does not specify the selection algorithm.
- The 4 best third-place teams must be selected by: **points → goal difference → goals scored → head-to-head → fair play → drawing of lots** (FIFA tiebreaker rules). This requires cross-group comparison logic that is not described anywhere.
- Additionally, the bracket pairing in the Round of 32 depends on specific group matchups (e.g., Group A winner plays Group B runner-up, etc.). The specific pairing rules for the 48-team format are not documented.
  - *Recommendation:* Add a section defining:
    1. The exact ranking criteria for 3rd-place teams (with cross-group comparison).
    2. The Round of 32 pairing rules (which group winners play which runner-up).
    3. The bracket seed structure (which groups feed which bracket sections).

### Concern — Bracket tree construction from flat data
- **Phase 5.3** says "Build bracket tree structure from flat match data" but provides no algorithm. With 48 teams and 12 groups, the tree construction is non-trivial:
  - Group stage produces 48 ranked teams (12 × top-2 + 4 best 3rds = 28, plus 4 more 3rds = 32).
  - The Round of 32 pairings must be determined from group geometry.
  - Subsequent rounds depend on Round of 32 results.
  - *Recommendation:* Specify the tree-building algorithm or reference FIFA's official bracket format document.

---

## 4. Architectural Gaps & Over-Engineering

### Blocker — Fallback data model mismatch (detailed in Section 2)
(See above. This is the most critical architectural gap.)

### Concern — Redundant hooks
- **Phase 7** defines both `useTournamentData` and `useMatchResults`. These overlap significantly — `useTournamentData` already fetches matches (Phase 7.1). Having a second hook for match results creates potential for data inconsistency (two sources of truth for the same data).
  - *Recommendation:* Consolidate into a single `useTournamentData` hook that returns all data, with a `refetchMatches()` method for the auto-refresh toggle.

### Concern — Over-engineered flag component
- **Phase 2, project structure** lists `BracketNodeFlag.tsx` as a separate component. Flag display is a simple `<img>` with a URL — splitting it into its own component adds unnecessary complexity.
  - *Recommendation:* Inline the flag rendering in `BracketNode.tsx`.

### Gap — No specification for the "best 3rd-place" ranking algorithm
- **Phase 6.2** mentions tiebreakers but only for within-group sorting. Cross-group comparison for 3rd-place teams needs a separate algorithm.
  - *Recommendation:* Add explicit logic for cross-group 3rd-place ranking.

### Gap — Bracket connector rendering on responsive layouts
- **Phase 5.4** mentions SVG/CSS connectors but doesn't address how they handle responsive breakpoints. SVG coordinates are absolute; when nodes resize on mobile, lines will misalign.
  - *Recommendation:* Use a library like `react-flow` or implement a responsive SVG approach with `viewBox` and percentage-based positioning.

### Concern — Error resilience in fallback chain
- **Phase 8.3** mentions "Fallback to secondary API on primary failure" but doesn't address:
  - What happens if *both* APIs fail?
  - What partial data is acceptable? (e.g., groups but no matches)
  - Should the app show stale cached data?
  - *Recommendation:* Define an error resilience strategy:
    1. Try primary API.
    2. If it fails, try fallback API.
    3. If both fail, show cached data (if available) with a "data may be stale" banner.
    4. If no cache, show a user-friendly error with retry button.

---

## 5. API Layer Design (Primary + Fallback)

### Correct
- The primary/fallback pattern is sound in principle.
- Retry logic (Phase 2.2: "max 2 retries, 1s delay") is a reasonable default.
- Response type validation/guarding (Phase 2.2) is good practice for external APIs.

### Blocker — Two incompatible API schemas (detailed in Section 2)
(See above. This is the most critical issue.)

### Concern — API key for fallback is a deployment blocker
- football-data.org requires an API key (Phase 2.3). If the developer doesn't have one, the fallback path is broken. The task should clearly state this dependency.
  - *Recommendation:* Add a clear "prerequisites" section noting the football-data.org API key requirement.

### Concern — No rate-limit handling
- Neither API client mentions rate-limit awareness. If the primary API has a rate limit and the fallback is triggered during a match (high traffic), both could be throttled.
  - *Recommendation:* Add rate-limit headers parsing and exponential backoff for the fallback client.

### Gap — No API versioning strategy
- Both APIs may change their schemas. The task mentions "response type validation/guarding" (Phase 2.2) but doesn't specify how schema drift is handled (e.g., version negotiation, schema migration).
  - *Recommendation:* Add schema version checks or graceful degradation for unknown fields.

---

## Summary of Findings

### Blockers (must be resolved before implementation)
| # | Issue | Location | Impact |
|---|-------|----------|--------|
| B1 | Fallback API (football-data.org) has incompatible data model; transformation layer doesn't address normalization | Phase 2.2 + 2.3 + 2.4 | Incorrect data when fallback is triggered |
| B2 | "Best 4 third-place teams" selection algorithm is underspecified | Phase 6.1 + 6.2 | Cannot correctly determine knockout qualification |
| B3 | Round of 32 pairing rules not defined | Phase 5.3 | Cannot build correct bracket structure |

### Concerns (should be addressed)
| # | Issue | Location | Impact |
|---|-------|----------|--------|
| C1 | Redundant hooks (`useTournamentData` + `useMatchResults`) | Phase 7 | Potential data inconsistency |
| C2 | Bracket connector lines won't work reliably with CSS on responsive layouts | Phase 5.4 | Visual breakage on mobile/tablet |
| C3 | No error resilience strategy for dual-API failure | Phase 8.3 | App shows nothing if both APIs fail |
| C4 | football-data.org API key is a deployment blocker not clearly called out | Phase 2.3 | Developer may be blocked on setup |
| C5 | No rate-limit handling for either API | Phase 2.2 + 2.3 | Fallback could cascade-fail under load |

### Suggestions (nice-to-have improvements)
| # | Issue | Location | Recommendation |
|---|-------|----------|----------------|
| S1 | `BracketNodeFlag.tsx` is over-engineered | Phase 2 (project structure) | Inline flag rendering in `BracketNode.tsx` |
| S2 | No schema versioning strategy for APIs | Phase 2 | Add schema version checks |
| S3 | Flag image source undecided | Phase 3.1 | Lock in `flagcdn.com` early to avoid rework |
