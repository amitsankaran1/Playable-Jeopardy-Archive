import { getTodaysGame } from "@/lib/db";
import GameBoard from "./components/GameBoard";

// Server-render per request — the DB connection isn't available at build time,
// and the daily category changes on the ET date boundary anyway.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const game = await getTodaysGame();

  if (!game) {
    return (
      <div className="app-shell">
        <div className="hero">
          <div className="hero-eyebrow">Setup Required</div>
          <h1 className="hero-title">Daily Double</h1>
          <p className="hero-subtitle">
            No categories available yet. Set <code>DATABASE_URL</code> and run{" "}
            <code>pnpm migrate</code> to seed the archive.
          </p>
        </div>
      </div>
    );
  }

  return <GameBoard initialGame={game} />;
}
