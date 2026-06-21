export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-4 px-4 text-center text-sm">
      <div className="max-w-7xl mx-auto">
        <p>
          Data provided by{" "}
          <a
            href="https://worldcup26.ir"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fifa-blue-400 hover:underline"
          >
            worldcup26.ir
          </a>{" "}
          &middot; Flags by{" "}
          <a
            href="https://flagcdn.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-fifa-blue-400 hover:underline"
          >
            flagcdn.com
          </a>
        </p>
        <p className="mt-1 text-xs text-gray-500">
          FIFA World Cup 2026 Dashboard &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
