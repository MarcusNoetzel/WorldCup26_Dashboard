# Maintainability & Developer Experience Review — tasks.md

**Reviewed file**: `tasks.md` (197 lines)
**Project**: FIFA World Cup 2026 Dashboard — Next.js bracket visualization
**Reviewer focus**: Practical execution quality for a worker agent

---

## Blockers (must resolve before implementation)

### B1: API data schema is underspecified — critical for Phase 2
**Location**: `tasks.md` lines 47–78 (Phase 2)

The plan references `worldcup26.ir` API endpoints (`/get/teams`, `/get/games`, `/get/groups`, `/get/stadiums`) but provides no insight into the actual response shapes. The task "Add response type validation/guarding" (line 66) acknowledges this risk but doesn't mitigate it. A worker agent will need to inspect the actual API responses before writing correct type definitions.

**Recommendation**: Add a prerequisite task to inspect `https://worldcup26.ir/get/teams` and `https://worldcup26.ir/get/games` and document the actual response schema. The `football-data.org` fallback is equally problematic — that API primarily covers league competitions, not World Cup tournaments. Verify data availability before committing to it as a fallback.

### B2: FIFA tiebreaker algorithm is unspecified
**Location**: `tasks.md` line 164 (Phase 6.2)

"Sort teams by standard FIFA tiebreakers (points → GD → GF → head-to-head)" is referenced but the exact algorithm is not defined. FIFA tiebreaker rules are more nuanced (head-to-head points, head-to-head GD, head-to-head GF, then overall GD, overall GF, then fair play points, then drawing of lots). A worker agent will make arbitrary choices here.

**Recommendation**: Either link to the specific FIFA regulation or define the exact tiebreaker order explicitly.

### B3: "FIFA World Cup 2026 palette" has no color values
**Location**: `tasks.md` line 180 (Phase 9.2)

"Consistent color scheme (FIFA World Cup 2026 palette)" — no hex values, no Tailwind config, no design tokens. A worker agent will guess.

**Recommendation**: Define the color palette explicitly in a Tailwind config or CSS custom properties.

---

## Concerns (will likely cause rework or confusion)

### C1: Bracket connector lines (SVG) are a high-risk implementation target
**Location**: `tasks.md` lines 128–135 (Phase 5.4) and lines 111–113 (Phase 5.2)

SVG-based bracket connectors that "align correctly even when bracket nodes are different widths" (line 135) is a genuinely difficult problem. The connector endpoints depend on rendered node positions, which in a server-rendered Next.js app means either:
- Using `useLayoutEffect`/`useEffect` to measure DOM nodes after render (fragile, causes layout thrashing)
- Using a canvas/SVG library (adds dependency)
- Pre-calculating positions based on known node dimensions (brittle if content changes)

This task alone could consume disproportionate time and cause visual bugs.

**Recommendation**: Consider a CSS-only approach using `::before`/`::after` pseudo-elements or a lightweight library like `react-flow` or `dagre` for layout calculation. If SVG is required, specify that connector alignment should use fixed-width nodes to simplify positioning math.

### C2: 48-team knockout qualification logic is complex and API-dependent
**Location**: `tasks.md` lines 107–108 (Phase 5.3) and lines 154–155 (Key Technical Notes)

"Top 2 from each group + 4 best 3rd-place teams" is not a simple data transformation — it requires:
1. Fetching all 12 groups
2. Calculating standings for each group
3. Ranking all 12 third-placed teams against each other
4. Determining which 4 qualify

The task description treats this as a simple bullet point but it's a substantial algorithmic challenge. The API may or may not provide pre-computed qualification data.

**Recommendation**: Break this into a dedicated task: "Implement 48-team knockout qualification algorithm" with explicit steps for ranking 3rd-place teams.

### C3: Responsive bracket scrolling is UX-debatable and technically tricky
**Location**: `tasks.md` line 115 (Phase 5.3)

"Scrollable container for mobile (horizontal scroll for bracket width)" is mentioned but horizontal scrolling of a bracket visualization is a known UX anti-pattern. The bracket's tree structure is designed to be read left-to-right, and horizontal scrolling breaks that reading pattern.

**Recommendation**: Consider a vertical bracket layout (top-to-bottom) for mobile instead, or a zoom-and-pan approach. At minimum, define the mobile layout explicitly rather than leaving it as a vague requirement.

### C4: `country-flag-emoji` or flag CDN choice is deferred
**Location**: `tasks.md` lines 84–86 (Phase 3.1)

"Choose flag image source (options: flagcdn.com, flagpedia.net, or country-flag-emoji npm package)" is left as an open choice. These have very different tradeoffs:
- `country-flag-emoji`: zero network requests, but limited country coverage and rendering consistency issues across OS/fonts
- `flagcdn.com`: reliable, but adds external dependency
- `flagpedia.net`: less reliable CDN

**Recommendation**: Make the decision now and document it. Flagcdn.com with emoji fallback is the safest default.

### C5: Testing tasks are too vague for execution
**Location**: `tasks.md` lines 186–202 (Phase 10)

Tasks like "Test bracket rendering with mock data" (line 193) and "Test group standings calculation with mock data" (line 194) don't specify:
- Which testing framework (Jest? Vitest? Playwright?)
- What constitutes "mock data"
- What assertions to make
- What coverage threshold (if any)

**Recommendation**: Specify the test framework, at least one concrete test case per test file, and a coverage target (e.g., "80% line coverage on lib/").

---

## Suggestions (improvements for execution quality)

### S1: Task 3 (Flags & Past Championship Data) can partially parallelize with Phase 2
**Location**: `tasks.md` lines 80–88

The past championship lookup table (hardcoded data) is completely independent of API work. A worker agent could implement Phase 3.2 (past championships) while another works on Phase 2.2 (API clients). Only Phase 3.1 (flag image service) has a soft dependency on the API layer for country codes.

**Recommendation**: Update the dependency graph to allow Phase 3.2 to start alongside Phase 2.

### S2: Phase 6 (Group Standings) is blocked only by Phase 2 types, not Phase 5
**Location**: `tasks.md` lines 137–167

The dependency graph shows Phase 6 depending on Phase 5, but group standings calculation only needs the `Team` and `Match` types from Phase 2. It doesn't depend on bracket rendering components.

**Recommendation**: Allow Phase 6 to parallelize with Phase 5 once Phase 2 is complete.

### S3: Add a "Data seeding / static fixture" task
**Location**: N/A (missing from plan)

Since the World Cup 2026 data is time-bound and the API may be unreliable, consider adding a task to create a static fixture file (JSON) with sample tournament data. This enables offline development, testing, and demo without API dependency.

**Recommendation**: Add a task: "Create `data/fixtures.json` with sample tournament data for offline development."

### S4: Clarify Next.js App Router patterns
**Location**: `tasks.md` throughout

The plan mentions "Server component for initial data fetching (SSR)" (line 170) and "Client component wrapper for live refresh capability" (line 172) but doesn't specify how these interact. In Next.js 15 App Router, the pattern is typically:
- Server component fetches data
- Passes data as props to a client component
- Client component handles interactivity

This is a standard pattern but worth making explicit for a worker agent that may not be familiar with the latest App Router conventions.

### S5: `pastChampionships` lookup table is incomplete
**Location**: `tasks.md` lines 89–90 (Phase 3.2)

The hardcoded list only covers 8 teams: Brazil, Germany, Italy, Argentina, France, Uruguay, England, Spain. The tournament has 48 teams. The lookup table should either include all 48 teams (with 0 for non-champions) or have a clear fallback behavior for teams not in the list.

**Recommendation**: Either list all 48 teams or specify: "Return 0 for teams not in the lookup table."

### S6: Missing task for environment configuration
**Location**: `tasks.md` line 18

"Configure `next.config.ts` with proper environment variables" and "Set up `.env.local`" are mentioned but the actual `.env.local` keys aren't listed. The worker agent needs to know the exact variable names (e.g., `NEXT_PUBLIC_API_BASE_URL`, `FOOTBALL_DATA_API_KEY`, etc.).

**Recommendation**: Add a `.env.local` template to the tasks or the project root.

---

## Summary of Findings

| Category | Count | Severity |
|----------|-------|----------|
| Blockers | 3 | Must resolve before implementation |
| Concerns | 5 | Will likely cause rework or confusion |
| Suggestions | 6 | Improve execution quality |

### Top 3 risks for a worker agent:
1. **API schema unknown** (B1) — The worker will write types against guessed schemas
2. **Bracket connectors are technically complex** (C1) — SVG alignment with variable-width nodes
3. **48-team qualification algorithm** (C2) — More algorithmic work than the task description implies

### Parallelization opportunities:
- Phase 3.2 (past championships) ↔ Phase 2 (API types/clients)
- Phase 6 (group standings) ↔ Phase 5 (bracket) — once Phase 2 types are ready
- Phase 10 testing (unit tests for lib/) ↔ Phase 5/6 implementation
