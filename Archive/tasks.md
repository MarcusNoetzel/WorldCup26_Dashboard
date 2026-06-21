# FIFA World Cup 2026 Dashboard — Implementation Task List

## Project Overview

A production-ready, server-rendered Next.js application that displays the full FIFA World Cup 2026 tournament bracket in a vertical layout. Each node shows the country name, national flag, and past championship count in brackets. Data is fetched on each request from public APIs — no database or authentication needed.

### Tech Stack
- **Framework**: Next.js 15+ (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Data Source**: [worldcup26.ir API](https://worldcup26.ir) (free, no key required)
- **Deployment**: Local development (Vercel-ready)

---

## Phase 1: Project Setup & Configuration

### 1.1 Initialize Next.js Project
- [ ] Create Next.js project with TypeScript, Tailwind CSS, and App Router
- [ ] Configure `next.config.ts` with proper environment variables
- [ ] Set up `.env.local` with API configuration (see `.env.local.template` below)
- [ ] Configure `tsconfig.json` with path aliases (`@/` for src/)

### 1.2 Project Structure
- [ ] Create directory structure:
  ```
  src/
  ├── app/                    # Next.js App Router
  │   ├── layout.tsx
  │   ├── page.tsx
  │   └── globals.css
  ├── lib/
  │   ├── api/                # API client functions
  │   │   └── worldcup26.ts   # worldcup26.ir API client
  │   ├── types/              # TypeScript type definitions
  │   │   ├── team.ts
  │   │   ├── match.ts
  │   │   ├── group.ts
  │   │   └── tournament.ts
  │   └── utils/              # Utility functions
  │       ├── flags.ts
  │       └── tournament.ts
  ├── components/
  │   ├── layout/
  │   │   ├── Header.tsx
  │   │   └── Footer.tsx
  │   ├── bracket/
  │   │   ├── TournamentBracket.tsx
  │   │   ├── BracketRound.tsx
  │   │   └── BracketNode.tsx
  │   ├── groups/
  │   │   ├── GroupStandings.tsx
  │   │   └── GroupTable.tsx
  │   └── shared/
  │       ├── LoadingSkeleton.tsx
  │       └── ErrorBoundary.tsx
  └── hooks/
      └── useTournamentData.ts
  └── data/
      └── past-championships.json
  ```

### 1.3 SEO & Metadata
- [ ] Add `<title>` and `<meta description>` to `layout.tsx`
- [ ] Configure Open Graph and Twitter Card meta tags
- [ ] Add `app/manifest.ts` for PWA support
- [ ] Add `robots.txt` and `sitemap.xml`
- [ ] Configure favicon in `next.config.ts`

### 1.4 Environment Configuration
- [ ] Create `.env.local.template` with all required variables:
  ```
  NEXT_PUBLIC_API_BASE_URL=https://worldcup26.ir
  NEXT_PUBLIC_API_TIMEOUT=10000
  NEXT_PUBLIC_REVALIDATE_INTERVAL=60
  ```

---

## Phase 2: API Layer & Data Types

### 2.1 TypeScript Type Definitions
- [ ] Define `Team` interface (id, name, code, flag, pastChampionships, group)
- [ ] Define `Match` interface (id, homeTeam, awayTeam, homeScore, awayScore, status, stage, date, group)
- [ ] Define `Group` interface (name, teams[], standings)
- [ ] Define `Tournament` interface (groups[], matches[], rounds[])
- [ ] Define `BracketRound` type (roundName, matches[])
- [ ] Inspect actual API responses at `https://worldcup26.ir/get/teams` and `https://worldcup26.ir/get/games` to document real response schemas
- [ ] Define API response types for worldcup26.ir endpoints (based on inspected schemas)

### 2.2 API Client — worldcup26.ir (Primary)
- [ ] Create `fetchTeams()` — GET `/get/teams`
- [ ] Create `fetchMatches()` — GET `/get/games`
- [ ] Create `fetchGroups()` — GET `/get/groups`
- [ ] Create `fetchStadiums()` — GET `/get/stadiums`
- [ ] Implement error handling with retry logic (max 2 retries, 1s delay)
- [ ] Add response type validation/guarding (since API schema may vary)
- [ ] Implement request caching with `revalidate` (Server-Side Rendering, revalidate every 60s)

### 2.3 Data Transformation Layer
- [ ] Transform worldcup26.ir match data → `Match` type
- [ ] Transform worldcup26.ir team data → `Team` type
- [ ] Build `TournamentBracket` structure from match data (group stage → round of 32 → R16 → QF → SF → Final)
- [ ] Implement past championship count lookup (hardcoded for national teams: Brazil 5, Germany 4, Italy 4, Argentina 3, France 2, Uruguay 2, etc.)
- [ ] Use flag URLs from the worldcup26.ir API response (flagcdn.com)
- [ ] Implement fallback to flagcdn.com by ISO2 code if API flag is missing: `https://flagcdn.com/w40/{code}.png`

---

## Phase 3: Flag & Past Championship Data

### 3.1 Flag Image Service
- [ ] Use flag URLs from the worldcup26.ir API response (already uses flagcdn.com)
- [ ] Create `getFlagUrl(countryCode)` utility function
- [ ] Implement lazy loading for flag images (`<img loading="lazy">`)
- [ ] Add placeholder/fallback for missing flags

### 3.2 Past Championship Data
- [ ] Create `pastChampionships` lookup table keyed by FIFA code (hardcoded, since this is historical data):
  ```
  BRA: 5, GER: 4, ITA: 4, ARG: 3, FRA: 2, URU: 2, ENG: 1, ESP: 1
  (all other teams: 0)
  ```
- [ ] Store as `src/data/past-championships.json` for maintainability
- [ ] Create `getPastChampionships(fifaCode)` helper function (returns 0 for missing codes)
- [ ] Style the past championship count display (brackets, small font, subtle color)

---

## Phase 4: UI Components — Core Layout

### 4.1 Global Styles & Theme
- [ ] Configure Tailwind theme (colors, spacing, typography)
- [ ] Define CSS custom properties for tournament bracket colors
- [ ] Create responsive breakpoints (mobile-first)
- [ ] Add dark mode support (optional, if time permits)

### 4.2 Header Component (`Header.tsx`)
- [ ] Display FIFA World Cup 2026 title and logo
- [ ] Show last updated timestamp (from API data)
- [ ] Show data source indicator
- [ ] Add subtle animation on load
- [ ] Responsive: collapse gracefully on mobile

### 4.3 Footer Component (`Footer.tsx`)
- [ ] Display data source credits (worldcup26.ir)
- [ ] Add refresh timestamp
- [ ] Minimal styling, non-distracting

---

## Phase 5: UI Components — Tournament Bracket (Core Feature)

### 5.1 Bracket Node Component (`BracketNode.tsx`)
- [ ] Display country name (bold, readable)
- [ ] Display national flag (small, left-aligned)
- [ ] Display past championship count in brackets: `(🏆 5)`
- [ ] Display match score (if match is played): `2 - 1`
- [ ] Highlight winning team (bold, accent color)
- [ ] Show match status indicator (scheduled / in progress / finished)
- [ ] Style: card-like appearance with subtle shadow, rounded corners
- [ ] Hover effect: subtle scale or glow
- [ ] Responsive sizing (shrinks on mobile)

### 5.2 Bracket Round Component (`BracketRound.tsx`)
- [ ] Render a list of `BracketNode` pairs for a single round
- [ ] Draw connecting lines between nodes (CSS/SVG):
  - Horizontal connector from node 1 to node 2
  - Vertical line descending to next round
- [ ] Round label (e.g., "Round of 32", "Quarterfinals", "Semifinals", "Final")
- [ ] Proper spacing between rounds (consistent vertical rhythm)
- [ ] Handle empty/undecided slots (dashed outline, "TBD" text)

### 5.3 Tournament Bracket Component (`TournamentBracket.tsx`)
- [ ] Render all tournament rounds in vertical sequence:
  1. Group Stage (12 groups, A–L, each with 4 teams)
  2. Round of 32 (32 teams → 16 winners)
  3. Quarterfinals (8 teams → 4 winners)
  4. Semifinals (4 teams → 2 winners)
  5. Final (2 teams → 1 winner)
  6. Third-place match (required — official match 103)
- [ ] Build bracket tree structure from flat match data
- [ ] **Implement 48-team knockout qualification algorithm**:
  - Rank all 12 groups by FIFA tiebreaker rules (see Phase 6.2)
  - Select top 2 from each group (24 teams)
  - Rank all 12 third-placed teams against each other (points → GD → GF → head-to-head → fair play → drawing of lots)
  - Select top 4 third-place teams (8 teams → 32 total for Round of 32)
  - Map qualifying teams to Round of 32 bracket slots per FIFA pairing rules (A1 vs B2, C1 vs D2, E1 vs F2, G1 vs H2, I1 vs J2, K1 vs L2, plus 8 slots for best 3rds — see FIFA official bracket format)
- [ ] Handle placeholder team data (`team_id: 0`) in knockout matches — render as "TBD" with `team_label` as fallback text
- [ ] Handle 48-team tournament complexity (group stage has 12 groups vs traditional 8)
- [ ] Ensure proper alignment between rounds
- [ ] Scrollable container for mobile (horizontal scroll for bracket width)
- [ ] Loading skeleton for bracket while data fetches

### 5.4 Bracket Connector Lines
- [ ] Use SVG connectors between bracket rounds with computed coordinates
- [ ] Use fixed-width bracket nodes to simplify connector positioning math
- [ ] Lines should connect winner of match → next round slot
- [ ] Handle both completed matches (solid line) and upcoming (dashed)
- [ ] Ensure lines align correctly at all responsive breakpoints

---

## Phase 6: UI Components — Group Stage Standings

### 6.1 Group Standings Component (`GroupStandings.tsx`)
- [ ] Display all 12 groups (A through L) in a grid layout
- [ ] Each group shows: group name, team standings table
- [ ] Table columns: Position, Team, Played, Won, Drawn, Lost, GF, GA, GD, Points
- [ ] Highlight top teams advancing to knockout stage (typically top 2 + 4 best 3rd-place)
- [ ] Responsive grid: 4 columns on desktop, 2 on tablet, 1 on mobile

### 6.2 Group Table Component (`GroupTable.tsx`)
- [ ] Individual group standings table
- [ ] Color-code rows (winning position, advancing, eliminated)
- [ ] Sort teams by all 8 FIFA tiebreaker steps:
  1. Points in all group matches
  2. Goal difference in all group matches
  3. Goals scored in all group matches
  4. Points in matches between tied teams
  5. Goal difference in matches between tied teams
  6. Goals scored in matches between tied teams
  7. Fair play conduct (yellow/red cards)
  8. Drawing of lots
- [ ] Hover effect on rows
- [ ] Flag icon next to team name

---

## Phase 7: Data Hooks & State Management

### 7.1 `useTournamentData` Hook (consolidated)
- [ ] Fetch all tournament data (teams, matches, groups) on mount
- [ ] Handle loading state (show skeleton)
- [ ] Handle error state (show error boundary)
- [ ] Cache data in component state
- [ ] Provide `refetch()` function for manual refresh
- [ ] Provide `refetchMatches()` method for auto-refresh toggle (debounced, min 10s between calls)
- [ ] Return structured `Tournament` object with pre-computed bracket and standings

---

## Phase 8: Main Page & Integration

### 8.1 Main Page (`app/page.tsx`)
- [ ] Server component for initial data fetching (SSR)
- [ ] Client component wrapper for live refresh capability
- [ ] Layout: group standings on top, tournament bracket below
- [ ] Smooth scroll between sections
- [ ] Add "Refresh" button (client-side refetch)
- [ ] Add "Auto-refresh" toggle (every 60s)

### 8.2 Loading States
- [ ] Skeleton loader for bracket nodes (pulsing placeholders)
- [ ] Skeleton loader for group tables
- [ ] Loading spinner for data fetch
- [ ] Graceful degradation (show partial data if some fetches fail)

### 8.3 Error Handling
- [ ] Error boundary wrapping the entire app
- [ ] Per-component error states (bracket, groups, header)
- [ ] User-friendly error messages
- [ ] "Retry" button on error states
- [ ] Graceful degradation: if API fails, show user-friendly error with retry button
- [ ] If partial data available, show what's available with "data may be stale" banner

---

## Phase 9: Styling & Polish

### 9.1 Responsive Design
- [ ] Desktop: full-width bracket, multi-column group grid
- [ ] Tablet: reduced column count, adjusted spacing
- [ ] Mobile: horizontal scroll for bracket, single-column groups
- [ ] Test all breakpoints

### 9.2 Visual Polish
- [ ] Consistent color scheme (FIFA World Cup 2026 palette)
- [ ] Smooth transitions on state changes
- [ ] Subtle animations (node appear, score update)
- [ ] Winner highlight (gold accent for bracket winners)
- [ ] Typographic hierarchy (clear distinction between headers, teams, scores)
- [ ] Proper contrast ratios (WCAG AA minimum)

### 9.3 Accessibility
- [ ] Semantic HTML (tables for standings, lists for bracket)
- [ ] ARIA labels for interactive elements
- [ ] Keyboard navigation for bracket (focusable nodes)
- [ ] Screen reader support for score announcements
- [ ] Focus indicators on all interactive elements

---

## Phase 9.5: Static Fixture Data

### 9.5.1 Sample Data for Offline Development
- [ ] Create `data/fixtures.json` with sample tournament data for offline development and testing
  - All 48 teams with FIFA codes and flags
  - Sample group stage matches with scores
  - Sample knockout matches (some completed, some TBD)
  - Group standings computed from sample data
- [ ] Use fixtures to test bracket rendering without API dependency

---

## Phase 10: Testing & Quality

### 10.1 Unit Tests
- [ ] Test data transformation functions (match → bracket node)
- [ ] Test tiebreaker logic for group standings
- [ ] Test flag URL generation
- [ ] Test championship count lookup

### 10.2 Integration Tests
- [ ] Test API client error handling (network failure, retry logic)
- [ ] Test bracket rendering with mock data
- [ ] Test group standings calculation with mock data

### 10.3 Manual Testing
- [ ] Test with real API data (check all rounds render correctly)
- [ ] Test with incomplete data (some matches not yet played)
- [ ] Test with all matches completed (final played)
- [ ] Test with no data (API down)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing

---

## Phase 11: Documentation & DevOps

### 11.1 Documentation
- [ ] `README.md` with setup instructions
- [ ] `package.json` scripts (dev, build, start, lint, test)
- [ ] API documentation for worldcup26.ir data source used
- [ ] Known limitations (e.g., live updates are on refresh only, not WebSocket)

### 11.2 Linting & Formatting
- [ ] ESLint configuration with Next.js recommended rules
- [ ] Prettier configuration
- [ ] TypeScript strict mode enabled
- [ ] Pre-commit hooks (lint + format)

### 11.3 Build & Production
- [ ] Verify production build (`next build`)
- [ ] Test production server (`next start`)
- [ ] Check bundle size
- [ ] Optimize images (flags should be next/image optimized)
- [ ] Configure environment-specific behavior

---

## Task Dependencies & Priority

```
Phase 1 (Setup)         → Phase 2 (Types & API)
  → Phase 1.3 (SEO)     → Phase 1.4 (Env Config)
  → Phase 3 (Flags & Past Champs) [parallel to Phase 2]
                                                        ↓
Phase 4 (Layout)        → Phase 8 (Main Page)     ← Phase 7 (Hooks)
                                                        ↓
Phase 5 (Bracket)       → Phase 9 (Styling)       ← Phase 6 (Groups)
  ← Phase 9.5 (Fixtures)                              ↓
Phase 10 (Testing)      → Phase 11 (Docs)
```

**Highest priority tasks** (MVP — can demo without these):
1. Phase 1: Project setup
2. Phase 2: Types + API client (worldcup26.ir)
3. Phase 3: Flags + past championships [parallel to Phase 2]
4. Phase 5: Bracket node + round + tournament components
5. Phase 8: Main page integration

**Should-have tasks** (production-ready):
- Phase 4: Layout components
- Phase 6: Group standings
- Phase 7: Data hooks
- Phase 9: Responsive styling + accessibility
- Phase 10: Testing
- Phase 9.5: Static fixture data

**Nice-to-have tasks** (if time permits):
- Dark mode
- Auto-refresh toggle
- Cross-browser testing polish

---

## Key Technical Decisions & Notes

1. **SSR over SSG**: Use `fetch` with `revalidate: 60` in server components. The tournament data changes frequently during the event.

2. **48-team bracket complexity**: Unlike World Cups with 32 teams, the 2026 format has 12 groups with 4 teams each. The knockout stage starts with 32 teams (top 2 from each group + 4 best 3rd-place teams). The bracket must handle this correctly.

3. **Past championship data**: This is static historical data. Hardcode the lookup table rather than fetching it.

4. **Flag images**: Use flag URLs from the worldcup26.ir API (flagcdn.com). Implement `flagcdn.com/w40/{iso2code}.png` fallback.

5. **Bracket visualization**: The vertical bracket with SVG connector lines is the most complex visual component. Use fixed-width bracket nodes to simplify connector positioning math.

6. **No WebSocket**: The requirement is "fetch on each refresh" — not live updates. This keeps the architecture simple.

7. **Error resilience**: If the primary API is down, show a user-friendly error with retry button. If partial data is available, show it with a "data may be stale" banner.

8. **Static fixture data**: A `data/fixtures.json` file is provided for offline development and testing without API dependency.

9. **SEO**: Include metadata, Open Graph tags, Twitter Card tags, PWA manifest, robots.txt, and sitemap.xml for production readiness.
