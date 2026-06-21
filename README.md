# ⚽ FIFA World Cup 2026 Dashboard

A production-ready, server-rendered Next.js application that displays the full FIFA World Cup 2026 tournament bracket in a vertical layout. Each node shows the country name, national flag, and past championship count in brackets.

## Features

- **Group Stage Standings**: All 12 groups (A–L) with full standings tables
- **Knockout Bracket**: Round of 32, Quarterfinals, Semifinals, Final, and Third Place match
- **Live Data**: Fetches current results from [worldcup26.ir API](https://worldcup26.ir) on each page load
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Auto-refresh**: Optional 60-second auto-refresh toggle
- **SEO Optimized**: Open Graph, Twitter Cards, PWA manifest, sitemap

## Tech Stack

- **Framework**: Next.js 15 (App Router) with TypeScript
- **Styling**: Tailwind CSS
- **Data Source**: [worldcup26.ir API](https://worldcup26.ir) (free, no API key required)
- **Testing**: Jest + React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Copy environment template
cp .env.local.template .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Copy `.env.local.template` to `.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=https://worldcup26.ir
NEXT_PUBLIC_API_TIMEOUT=10000
NEXT_PUBLIC_REVALIDATE_INTERVAL=60
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout with metadata
│   ├── page.tsx            # Main dashboard page
│   ├── globals.css         # Global styles
│   ├── manifest.ts         # PWA manifest
│   ├── robots.ts           # Robots.txt
│   └── sitemap.ts          # Sitemap
├── lib/
│   ├── api/                # API client
│   │   └── worldcup26.ts   # worldcup26.ir API client
│   ├── types/              # TypeScript types
│   │   ├── team.ts         # Team type
│   │   ├── match.ts        # Match type
│   │   ├── group.ts        # Group type
│   │   ├── tournament.ts   # Tournament type
│   │   └── api.ts          # API response types
│   └── utils/              # Utility functions
│       ├── flags.ts        # Flag URL helpers
│       └── tournament.ts   # Data transformation
├── components/
│   ├── layout/             # Header, Footer
│   ├── bracket/            # Tournament bracket components
│   ├── groups/             # Group standings components
│   └── shared/             # LoadingSkeleton, ErrorBoundary
├── hooks/
│   └── useTournamentData.ts # Data fetching hook
└── data/
    ├── past-championships.json # Historical championship data
    └── fixtures.json           # Sample data for offline dev
```

## Known Limitations

- **Match data**: The worldcup26.ir API currently does not serve match results. The dashboard shows group standings and will display the knockout bracket once match data becomes available.
- **Live updates**: Data is fetched on page load and manual refresh. No WebSocket-based live updates.
- **48-team format**: The 2026 World Cup uses a new 48-team format with 12 groups. The knockout qualification algorithm follows FIFA rules (top 2 from each group + 4 best 3rd-place teams).

## Data Sources

- **Tournament data**: [worldcup26.ir](https://worldcup26.ir) — Free open-source FIFA World Cup 2026 API
- **Flag images**: [flagcdn.com](https://flagcdn.com) — Flag CDN service

## License

MIT
