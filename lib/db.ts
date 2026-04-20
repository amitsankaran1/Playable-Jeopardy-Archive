import { neon } from "@neondatabase/serverless";
import type {
  Category,
  GameDetails,
  GamePayload,
  PublicClue,
  Round,
} from "./types";
import {
  assignClueValues,
  formatDateLabel,
  formatShareDate,
  getCategoryIndex,
  getEasternDate,
} from "./game";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.",
  );
}

const sql = neon(process.env.DATABASE_URL);

interface CategoryRow {
  id: number;
  name: string;
  round: Round;
  game_id: string;
}

interface ClueRow {
  id: number;
  question: string;
  answer: string;
  is_daily_double: boolean;
}

interface GameRow {
  id: string;
  title: string | null;
  date: string | null;
  game_number: number | null;
  season_id: number | null;
}

async function getPlayableCategoryCount(): Promise<number> {
  const rows = (await sql`
    SELECT COUNT(*)::int AS count FROM playable_categories
  `) as { count: number }[];
  return rows[0]?.count ?? 0;
}

async function loadCategory(categoryId: number): Promise<CategoryRow | null> {
  const rows = (await sql`
    SELECT id, name, round, game_id
    FROM categories
    WHERE id = ${categoryId}
    LIMIT 1
  `) as CategoryRow[];
  return rows[0] ?? null;
}

async function loadClues(categoryId: number): Promise<ClueRow[]> {
  return (await sql`
    SELECT id, question, answer, is_daily_double
    FROM clues
    WHERE category_id = ${categoryId}
    ORDER BY id ASC
  `) as ClueRow[];
}

async function loadGame(gameId: string): Promise<GameRow | null> {
  const rows = (await sql`
    SELECT id, title, date, game_number, season_id
    FROM games
    WHERE id = ${gameId}
    LIMIT 1
  `) as GameRow[];
  return rows[0] ?? null;
}

async function buildPayload(categoryId: number): Promise<GamePayload | null> {
  const category = await loadCategory(categoryId);
  if (!category) return null;

  const [clueRows, gameRow] = await Promise.all([
    loadClues(category.id),
    loadGame(category.game_id),
  ]);

  const values = assignClueValues(category.round, clueRows.length);
  const publicClues: PublicClue[] = clueRows.map((c, i) => ({
    id: c.id,
    value: values[i] ?? "$0",
    question: c.question,
    isDailyDouble: Boolean(c.is_daily_double),
  }));

  const now = new Date();
  return {
    category: {
      id: category.id,
      name: category.name,
      round: category.round,
      gameId: category.game_id,
    },
    clues: publicClues,
    gameDetails: {
      id: gameRow?.id ?? category.game_id,
      title: gameRow?.title ?? "",
      date: gameRow?.date ?? "",
      gameNumber: gameRow?.game_number ?? null,
      seasonId: gameRow?.season_id ?? null,
    },
    dateLabel: formatDateLabel(now),
    shareDate: formatShareDate(now),
  };
}

export async function getTodaysGame(): Promise<GamePayload | null> {
  const total = await getPlayableCategoryCount();
  if (total === 0) return null;

  const today = getEasternDate();
  const index = getCategoryIndex(today, total);

  const rows = (await sql`
    SELECT id FROM playable_categories
    ORDER BY id
    OFFSET ${index} LIMIT 1
  `) as { id: number }[];
  const categoryId = rows[0]?.id;
  if (!categoryId) return null;

  return buildPayload(categoryId);
}

export async function getRandomGame(): Promise<GamePayload | null> {
  const rows = (await sql`
    SELECT id FROM playable_categories
    ORDER BY random()
    LIMIT 1
  `) as { id: number }[];
  const categoryId = rows[0]?.id;
  if (!categoryId) return null;

  return buildPayload(categoryId);
}

export async function getClueAnswer(clueId: number): Promise<string | null> {
  const rows = (await sql`
    SELECT answer FROM clues WHERE id = ${clueId} LIMIT 1
  `) as { answer: string }[];
  return rows[0]?.answer ?? null;
}

export type { Category, GameDetails, GamePayload, PublicClue };
