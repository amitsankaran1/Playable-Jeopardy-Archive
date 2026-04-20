import { NextResponse } from "next/server";
import { getTodaysGame } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const game = await getTodaysGame();
  if (!game) {
    return NextResponse.json(
      { error: "No categories available." },
      { status: 503 },
    );
  }
  return NextResponse.json(game);
}
