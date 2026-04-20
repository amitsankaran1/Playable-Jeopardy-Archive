# Daily Double — Playable Jeopardy! Archive

A web trivia game built on real Jeopardy! categories. Every day features a
deterministic daily category, and you can hit **Play Again** to pull another
random category from the archive whenever you want.

Built with Next.js 15 (App Router) + TypeScript, backed by Postgres (Neon /
Vercel Postgres). Deploys to Vercel with zero config.

## How it works

- Each day, a SHA256 hash of the Eastern-time date selects one category from
  the archive. Everyone sees the same daily category.
- You get 5 clues of increasing value (\$200 – \$1,000, or \$400 – \$2,000 for
  Double Jeopardy categories).
- Type your answer — fuzzy matching accepts close spellings and partial
  answers (Levenshtein ≤ 2 plus substring matches).
- Correct answers add to your score; wrong answers subtract. Skipping is
  free but reveals the answer without scoring.
- After 5 clues, share a Wordle-style emoji grid or hit **Play Again** for a
  brand-new random category.

## Local development

Requires Node 20+ and pnpm (or npm/yarn).

```bash
pnpm install
cp .env.example .env.local   # then fill in DATABASE_URL
pnpm migrate                 # one-time: loads jeopardy.db into Postgres
pnpm dev                     # localhost:3000
```

### Getting a DATABASE_URL

Easiest: create a free Neon project at <https://neon.tech> and copy its
connection string. On Vercel, attaching a Neon database to your project
auto-injects `DATABASE_URL` into every environment.

The migration script reads `jeopardy_game/jeopardy.db` (bundled in the repo),
drops and recreates the `seasons`, `games`, `categories`, `clues` tables,
and builds a `playable_categories` materialized view for fast daily/random
selection. It takes a few minutes for the full 322k-clue load.

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in Vercel — it auto-detects Next.js.
3. Add a Neon (or Vercel Postgres) database; `DATABASE_URL` is injected.
4. Run the migration once from your local machine against the production
   `DATABASE_URL`, or from a Vercel one-off shell:
   ```bash
   DATABASE_URL="<prod connection string>" pnpm migrate
   ```
5. Deploy. The `/` route is revalidated hourly; `/api/game/random` is always
   dynamic.

## Project layout

```
app/
  layout.tsx          Root layout
  page.tsx            Server component: loads today's category
  globals.css         Jeopardy!-themed styling
  components/
    GameBoard.tsx     Client component: board, scoring, popup, share
  api/
    game/today        GET — today's deterministic category
    game/random       GET — random category (Play Again)
    answer            POST — validate a guess against a clue
lib/
  db.ts               Neon SQL client + query helpers
  game.ts             Daily rotation (SHA256), clue value assignment
  answer.ts           Fuzzy answer matcher (Levenshtein + substring)
  types.ts            Shared types
scripts/
  migrate-sqlite-to-postgres.ts   One-time data load
jeopardy_game/
  jeopardy.db         Source SQLite DB (43MB, 322k clues, 32 seasons)
```

## Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start dev server on :3000 |
| `pnpm build` | Production build |
| `pnpm start` | Serve production build |
| `pnpm typecheck` | Run `tsc --noEmit` |
| `pnpm migrate` | Load SQLite → Postgres |

## License / attribution

Fan-made, non-commercial. The Jeopardy! trademark and all show content belong
to Jeopardy Productions, Inc. This project is not affiliated with or
sponsored by Jeopardy Productions, Inc.
