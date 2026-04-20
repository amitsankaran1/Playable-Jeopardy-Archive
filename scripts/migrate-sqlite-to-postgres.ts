/**
 * One-time migration: jeopardy_game/jeopardy.db (SQLite) → Postgres (Neon/Vercel).
 *
 * Usage:
 *   DATABASE_URL=postgres://... pnpm migrate
 *
 * Idempotent: drops and recreates the four tables + playable_categories view.
 */
import Database from "better-sqlite3";
import { neon } from "@neondatabase/serverless";
import { resolve } from "node:path";

const SQLITE_PATH = resolve(
  process.cwd(),
  "jeopardy_game",
  "jeopardy.db",
);
const BATCH_SIZE = 500;

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set.");
  }
  const sql = neon(process.env.DATABASE_URL);
  const sqlite = new Database(SQLITE_PATH, { readonly: true });

  console.log(`Reading from ${SQLITE_PATH}`);

  console.log("Dropping existing schema…");
  await sql`DROP MATERIALIZED VIEW IF EXISTS playable_categories`;
  await sql`DROP TABLE IF EXISTS clues`;
  await sql`DROP TABLE IF EXISTS categories`;
  await sql`DROP TABLE IF EXISTS games`;
  await sql`DROP TABLE IF EXISTS seasons`;

  console.log("Creating tables…");
  await sql`
    CREATE TABLE seasons (
      id INT PRIMARY KEY,
      season_number INT
    )
  `;
  await sql`
    CREATE TABLE games (
      id TEXT PRIMARY KEY,
      date TEXT,
      season_id INT,
      title TEXT,
      game_number INT
    )
  `;
  await sql`
    CREATE TABLE categories (
      id INT PRIMARY KEY,
      name TEXT,
      round TEXT,
      game_id TEXT
    )
  `;
  await sql`
    CREATE TABLE clues (
      id INT PRIMARY KEY,
      category_id INT,
      question TEXT,
      answer TEXT,
      is_daily_double BOOLEAN DEFAULT FALSE,
      is_final_jeopardy BOOLEAN DEFAULT FALSE
    )
  `;

  const copy = async <T extends Record<string, unknown>>(
    table: string,
    columns: string[],
    rows: T[],
  ) => {
    for (let i = 0; i < rows.length; i += BATCH_SIZE) {
      const batch = rows.slice(i, i + BATCH_SIZE);
      const params: unknown[] = [];
      const placeholders = batch.map((row) => {
        const group = columns.map((col) => {
          params.push(row[col]);
          return `$${params.length}`;
        });
        return `(${group.join(",")})`;
      });
      const query = `INSERT INTO ${table} (${columns.join(",")}) VALUES ${placeholders.join(",")}`;
      await sql(query, params);
      console.log(
        `  ${table}: ${Math.min(i + BATCH_SIZE, rows.length)} / ${rows.length}`,
      );
    }
  };

  const seasons = sqlite
    .prepare("SELECT id, season_number FROM seasons")
    .all() as { id: number; season_number: number }[];
  console.log(`Seasons: ${seasons.length}`);
  await copy("seasons", ["id", "season_number"], seasons);

  const games = sqlite
    .prepare(
      "SELECT id, date, season_id, title, game_number FROM games",
    )
    .all() as {
    id: string;
    date: string | null;
    season_id: number | null;
    title: string | null;
    game_number: number | null;
  }[];
  console.log(`Games: ${games.length}`);
  await copy(
    "games",
    ["id", "date", "season_id", "title", "game_number"],
    games,
  );

  const categories = sqlite
    .prepare("SELECT id, name, round, game_id FROM categories")
    .all() as {
    id: number;
    name: string | null;
    round: string | null;
    game_id: string | null;
  }[];
  console.log(`Categories: ${categories.length}`);
  await copy(
    "categories",
    ["id", "name", "round", "game_id"],
    categories,
  );

  const clues = sqlite
    .prepare(
      `SELECT id, category_id, question, answer,
              COALESCE(is_daily_double, 0) AS is_daily_double,
              COALESCE(is_final_jeopardy, 0) AS is_final_jeopardy
       FROM clues`,
    )
    .all() as {
    id: number;
    category_id: number | null;
    question: string | null;
    answer: string | null;
    is_daily_double: number;
    is_final_jeopardy: number;
  }[];
  console.log(`Clues: ${clues.length}`);
  const cluesNormalized = clues.map((c) => ({
    id: c.id,
    category_id: c.category_id,
    question: c.question,
    answer: c.answer,
    is_daily_double: Boolean(c.is_daily_double),
    is_final_jeopardy: Boolean(c.is_final_jeopardy),
  }));
  await copy(
    "clues",
    [
      "id",
      "category_id",
      "question",
      "answer",
      "is_daily_double",
      "is_final_jeopardy",
    ],
    cluesNormalized,
  );

  console.log("Creating indexes + materialized view…");
  await sql`CREATE INDEX idx_clues_category ON clues(category_id)`;
  await sql`
    CREATE MATERIALIZED VIEW playable_categories AS
    SELECT c.id
    FROM categories c
    WHERE c.round IN ('Jeopardy', 'Double Jeopardy')
      AND EXISTS (SELECT 1 FROM clues WHERE category_id = c.id)
  `;
  await sql`CREATE INDEX idx_playable_id ON playable_categories(id)`;

  sqlite.close();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
