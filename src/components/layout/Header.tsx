export default function Header({ lastUpdated }: { lastUpdated: string | null }) {
  return (
    <header className="bg-fifa-blue-900 text-white py-6 px-4 shadow-lg">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-3xl sm:text-4xl">⚽</span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              FIFA World Cup 2026
            </h1>
            <p className="text-fifa-blue-200 text-sm">
              Live Tournament Dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-fifa-blue-200">
          {lastUpdated && (
            <span>
              Updated: {new Date(lastUpdated).toLocaleString()}
            </span>
          )}
          <span className="hidden sm:inline text-xs bg-fifa-blue-800 px-2 py-1 rounded">
            Source: worldcup26.ir
          </span>
        </div>
      </div>
    </header>
  );
}
