import { NextResponse } from "next/server";
import { getClueAnswer } from "@/lib/db";
import { isCorrect } from "@/lib/answer";
import type { AnswerRequest, AnswerResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: AnswerRequest;
  try {
    body = (await req.json()) as AnswerRequest;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const clueId = Number(body.clueId);
  if (!Number.isInteger(clueId) || clueId <= 0) {
    return NextResponse.json({ error: "Invalid clueId" }, { status: 400 });
  }

  const correctAnswer = await getClueAnswer(clueId);
  if (!correctAnswer) {
    return NextResponse.json({ error: "Clue not found" }, { status: 404 });
  }

  const guess = typeof body.guess === "string" ? body.guess : "";
  const response: AnswerResponse = {
    correct: isCorrect(guess, correctAnswer),
    correctAnswer,
  };
  return NextResponse.json(response);
}
