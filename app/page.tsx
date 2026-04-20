import { getTodaysGame } from "@/lib/db";
import GameBoard from "./components/GameBoard";

// Server-render per request — the DB connection isn't available at build time,
// and the daily category changes on the ET date boundary anyway.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const game = await getTodaysGame();

  if (!game) {
    return (
      <main>
        <h1>Daily Double</h1>
        <p style={{ padding: 20 }}>
          No categories available. The database may not be seeded yet — run{" "}
          <code>pnpm migrate</code> after setting <code>DATABASE_URL</code>.
        </p>
      </main>
    );
  }

  return <GameBoard initialGame={game} />;
}
