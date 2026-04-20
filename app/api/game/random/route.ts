import { NextResponse } from "next/server";
import { getRandomGame } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const game = await getRandomGame();
  if (!game) {
    return NextResponse.json(
      { error: "No categories available." },
      { status: 503 },
    );
  }
  return NextResponse.json(game);
}
