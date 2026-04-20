export type Round = "Jeopardy" | "Double Jeopardy" | "Final Jeopardy";

export interface Category {
  id: number;
  name: string;
  round: Round;
  gameId: string;
}

export interface PublicClue {
  id: number;
  value: string;
  question: string;
  isDailyDouble: boolean;
}

export interface GameDetails {
  id: string;
  title: string;
  date: string;
  gameNumber: number | null;
  seasonId: number | null;
}

export interface GamePayload {
  category: Category;
  clues: PublicClue[];
  gameDetails: GameDetails;
  dateLabel: string;
  shareDate: string;
}

export interface AnswerRequest {
  clueId: number;
  guess: string;
}

export interface AnswerResponse {
  correct: boolean;
  correctAnswer: string;
}
