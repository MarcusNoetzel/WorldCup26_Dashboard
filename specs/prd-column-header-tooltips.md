# PRD: Column Header Tooltips for Group Standings

## Problem Statement

Casual football fans and first-time visitors to the FIFA World Cup 2026 Dashboard may not understand the abbreviated column headers in the **Group Stage Standings** tables. Abbreviations like `P`, `W`, `D`, `L`, `GF`, `GA`, `GD`, and `Pts` are standard in football but are not self-explanatory to everyone. There is currently no in-app mechanism to clarify these terms, forcing users to look up meanings externally or guess from context.

## Solution

Add hover-activated tooltips to each abbreviated column header in the Group Standings tables. Each tooltip displays the expanded abbreviation plus a brief plain-English explanation. A small `?` icon next to each abbreviation signals that help is available. On touch devices, tapping a header toggles the tooltip open/closed.

## User Stories

1. As a casual football fan, I want to see what "GD" stands for, so that I understand how teams are ranked when points are equal
2. As a first-time visitor to the dashboard, I want to know what "P" means in the standings table, so that I can interpret the data correctly
3. As a parent showing the World Cup to my child, I want tooltips to explain "GF" and "GA", so that I can teach them how standings work without leaving the page
4. As a user on a mobile device, I want to tap a column header to see its meaning, so that I can understand the standings on my phone
5. As a visually-oriented user, I want a `?` icon next to each abbreviation, so that I know help is available before I hover
6. As a user who already knows football terminology, I want the tooltips to be unobtrusive, so that they don't distract me from reading the standings
7. As a user on a small screen, I want tooltips to appear above the header, so that they don't overlap with the table data below
8. As a user who taps multiple headers on mobile, I want only one tooltip open at a time, so that the interface stays clean
9. As a user who taps outside a tooltip on mobile, I want the tooltip to close, so that I can dismiss it without re-tapping the same header
10. As an accessibility-conscious user, I want the tooltip content to be associated with its header via ARIA attributes, so that screen readers can convey the meaning
11. As a user hovering quickly across headers, I want the tooltip to appear and disappear smoothly, so that the experience feels responsive
12. As a user comparing multiple group tables, I want consistent tooltip behavior across all 12 group tables, so that I don't have to re-learn the interaction
13. As a developer, I want the tooltip to be a reusable component, so that I can add tooltips to other parts of the dashboard (e.g., the knockout bracket) without rewriting logic
14. As a developer, I want the tooltip styling to use the existing FIFA color palette, so that the feature feels cohesive with the rest of the dashboard

## Implementation Decisions

### New Module: `Tooltip` Component

- A new reusable React component placed in `src/components/shared/Tooltip.tsx`
- Accepts `content` (the tooltip text) and `children` (the trigger element, e.g., the header cell content)
- Renders a visually hidden tooltip that appears on `:hover` (desktop) or on tap (mobile)
- Positioned above the trigger element using CSS absolute positioning
- Styled with `fifa-blue-900` background and white text, matching the table header bar
- Includes a small arrow pointing downward toward the trigger
- Uses CSS transitions for smooth appear/disappear animations

### Modified Module: `GroupTable` Component

- Each abbreviated `<th>` cell wraps its content in the `Tooltip` component
- A small `?` icon (e.g., `<sup>` styled element) is appended to each abbreviation
- Tooltip content maps:
  - **P** → "Played: Number of matches played"
  - **W** → "Won: Number of matches won"
  - **D** → "Drawn: Number of matches drawn"
  - **L** → "Lost: Number of matches lost"
  - **GF** → "Goals For: Total goals scored"
  - **GA** → "Goals Against: Total goals conceded"
  - **GD** → "Goal Difference: Goals scored minus goals conceded"
  - **Pts** → "Points: 3 for a win, 1 for a draw, 0 for a loss"
- `aria-describedby` is set on each `<th>` to reference the tooltip's ID for screen reader support

### Mobile Tap Toggle

- The `Tooltip` component uses a `"use client"` directive and minimal React state (`useState`) to track open/closed on touch devices
- On `pointerdown` or `touchstart`, the tooltip toggles visibility
- Tapping outside the tooltip dismisses it (via a document-level listener or click-outside detection)
- On desktop (`:hover`), no JS state is needed — pure CSS handles show/hide

### CSS Architecture

- Tooltip styles defined as Tailwind utility classes where possible
- Custom CSS for positioning (arrow, above-trigger placement) added to `globals.css` or a co-located CSS module
- No external tooltip libraries introduced

### Accessibility

- Each tooltip trigger includes `aria-describedby` pointing to the tooltip element's ID
- The `?` icon includes `aria-hidden="true"` to avoid screen reader noise
- Tooltip content is focusable and dismissible via `Escape` key
- Sufficient color contrast between tooltip text and background (white on `fifa-blue-900`)

## Testing Decisions

### What Makes a Good Test

Tests should verify **external behavior**, not implementation details. For the Tooltip component, this means testing what the user sees and interacts with — not internal state variables or CSS class names. Tests should answer: "Does the tooltip appear with the right content when triggered?" not "Does the component set `isOpen` to `true`?"

### Modules to Test

1. **`Tooltip` component** (`src/__tests__/tooltip.test.ts` — new file)
   - Renders tooltip content when triggered (hover/tap)
   - Hides tooltip when trigger is removed / outside click occurs
   - Positions tooltip above the trigger element
   - Renders the `?` indicator icon
   - Applies correct ARIA attributes (`aria-describedby`, tooltip ID)
   - Toggles correctly on mobile tap (open → close → open)
   - Dismisses on `Escape` key press

2. **`GroupTable` component** (`src/__tests__/group-table.test.ts` — new file)
   - All 8 abbreviated headers render with tooltip triggers
   - Each tooltip contains the correct expanded text
   - `aria-describedby` is correctly wired between headers and tooltips
   - Tooltips render consistently across all group table instances

### Prior Art

- Existing tests in `src/__tests__/` use **Jest + React Testing Library**
- `tournament.test.ts` tests utility functions with straightforward assertions
- `flags.test.ts` and `championships.test.ts` test data transformation logic
- No existing component-level (rendering) tests — this PRD introduces the first React component tests in the project, establishing a pattern for future UI testing

## Out of Scope

- Tooltips on the **knockout bracket** section (TournamentBracket, BracketNode, BracketRound) — may be added in a future iteration using the same reusable component
- Tooltips on the **Header** or **Footer** components
- Internationalization (i18n) of tooltip text — tooltips are English-only for now
- Configurable tooltip delay or duration — fixed transition timing
- Tooltip content customization per group — all groups use identical tooltip text
- Server-side rendering of tooltip state — tooltips are purely client-side interactive elements

## Further Notes

- The `Tooltip` component is designed to be reusable beyond GroupTable. Future features (e.g., explaining "TBD" in the bracket, or "Third Place" match significance) can drop it in with zero additional plumbing.
- The minimal JS required for mobile tap toggle is contained entirely within the `Tooltip` component. `GroupTable` remains a passive consumer — no state management or event handling leaks into the table component.
- If the project later adopts a UI component library (e.g., Radix UI, Headless UI), the `Tooltip` component can be swapped out with minimal impact on `GroupTable`.
