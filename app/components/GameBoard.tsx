"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import type {
  AnswerResponse,
  GamePayload,
  PublicClue,
} from "@/lib/types";
import { Header } from "./Header";
import { ClueGrid, type ClueStatus } from "./ClueGrid";
import { ClueModal, type ClueResult } from "./ClueModal";
import { ResultsModal, type ResultMark } from "./ResultsModal";
import { ToastProvider, useToast } from "./Toast";

function parseValue(label: string): number {
  return parseInt(label.replace(/[^0-9]/g, ""), 10) || 0;
}

function Game({ initialGame }: { initialGame: GamePayload }) {
  const toast = useToast();
  const [game, setGame] = useState<GamePayload>(initialGame);
  const [clueStates, setClueStates] = useState<Record<number, ClueStatus>>({});
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<ResultMark[]>([]);
  const [activeClue, setActiveClue] = useState<PublicClue | null>(null);
  const [clueResult, setClueResult] = useState<ClueResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);

  const totalClues = game.clues.length;
  const gameComplete = results.length === totalClues && totalClues > 0;

  useEffect(() => {
    if (gameComplete) {
      const t = setTimeout(() => setShowResults(true), 650);
      return () => clearTimeout(t);
    }
  }, [gameComplete]);

  const resetGameState = useCallback(() => {
    setClueStates({});
    setScore(0);
    setResults([]);
    setActiveClue(null);
    setClueResult(null);
    setShowResults(false);
    setSubmitting(false);
  }, []);

  const getStatus = useCallback(
    (id: number): ClueStatus => clueStates[id] ?? "unanswered",
    [clueStates],
  );

  const openClue = useCallback(
    (clue: PublicClue) => {
      if (getStatus(clue.id) !== "unanswered") return;
      setActiveClue(clue);
      setClueResult(null);
    },
    [getStatus],
  );

  const closeClue = useCallback(() => {
    setActiveClue(null);
    setClueResult(null);
    setSubmitting(false);
  }, []);

  const finishClue = useCallback(
    (
      clue: PublicClue,
      outcome: "correct" | "wrong" | "skipped",
      answer: string,
    ) => {
      const value = parseValue(clue.value);
      setClueStates((prev) => ({ ...prev, [clue.id]: outcome }));
      if (outcome === "correct") {
        setScore((s) => s + value);
        setResults((r) => [...r, "✅"]);
      } else if (outcome === "wrong") {
        setScore((s) => s - value);
        setResults((r) => [...r, "❌"]);
      } else {
        setResults((r) => [...r, "⬜"]);
      }
      setClueResult({ outcome, correctAnswer: answer });
      setSubmitting(false);
    },
    [],
  );

  const submitGuess = useCallback(
    async (guess: string) => {
      if (!activeClue || submitting) return;
      setSubmitting(true);
      try {
        const res = await fetch("/api/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ clueId: activeClue.id, guess }),
        });
        if (!res.ok) throw new Error("bad response");
        const data = (await res.json()) as AnswerResponse;
        finishClue(
          activeClue,
          data.correct ? "correct" : "wrong",
          data.correctAnswer,
        );
      } catch {
        setSubmitting(false);
        toast.push("Connection error — try again.", "error");
      }
    },
    [activeClue, submitting, finishClue, toast],
  );

  const skipGuess = useCallback(async () => {
    if (!activeClue || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clueId: activeClue.id, guess: "" }),
      });
      if (!res.ok) throw new Error("bad response");
      const data = (await res.json()) as AnswerResponse;
      finishClue(activeClue, "skipped", data.correctAnswer);
    } catch {
      setSubmitting(false);
      toast.push("Connection error — try again.", "error");
    }
  }, [activeClue, submitting, finishClue, toast]);

  const shareText = useMemo(
    () =>
      [
        `Daily Double (${game.shareDate})`,
        game.category.name,
        `Score: ${score < 0 ? "-$" : "$"}${Math.abs(score)}`,
        results.join(""),
      ]
        .join("\n")
        .trim(),
    [game.shareDate, game.category.name, score, results],
  );

  const handleShare = useCallback(async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text: shareText });
        return;
      } catch {
        /* user dismissed — fall through to clipboard */
      }
    }
    try {
      await navigator.clipboard.writeText(shareText);
      toast.push("Results copied to clipboard", "success");
    } catch {
      toast.push("Couldn't copy results", "error");
    }
  }, [shareText, toast]);

  const loadRandom = useCallback(async () => {
    setLoadingNext(true);
    try {
      const res = await fetch("/api/game/random", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const next = (await res.json()) as GamePayload;
      resetGameState();
      setGame(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast.push("Couldn't load another category", "error");
    } finally {
      setLoadingNext(false);
    }
  }, [resetGameState, toast]);

  const anyAnswered = Object.keys(clueStates).length > 0;

  return (
    <div className="app-shell">
      <Header score={score} showScore={anyAnswered} />

      <AnimatePresence mode="wait">
        <motion.div
          key={game.category.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          style={{ display: "flex", flexDirection: "column", gap: "var(--s-5)" }}
        >
          <div className="hero">
            <div className="hero-eyebrow">Today's Category</div>
            <h1 className="hero-title">{game.dateLabel}</h1>
            <p className="hero-subtitle">
              Five clues, one category. Pick a value to play.
            </p>
          </div>

          <ClueGrid
            categoryName={game.category.name}
            dateLabel={game.category.round}
            clues={game.clues}
            getStatus={getStatus}
            onSelect={openClue}
          />

          <div className="game-info">
            <span className="game-info-item">
              <strong>Season {game.gameDetails.seasonId ?? "?"}</strong>
            </span>
            <span className="game-info-sep">·</span>
            <span className="game-info-item">
              Game #{game.gameDetails.gameNumber ?? "?"}
            </span>
            <span className="game-info-sep">·</span>
            <span className="game-info-item">
              Aired {game.gameDetails.date || "—"}
            </span>
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="disclaimer">
        Fan-made, non-commercial. Jeopardy!® and related marks are the property
        of Jeopardy Productions, Inc. This site is not affiliated with or
        endorsed by them.
      </p>

      <ClueModal
        clue={activeClue}
        result={clueResult}
        submitting={submitting}
        onClose={closeClue}
        onSubmit={submitGuess}
        onSkip={skipGuess}
      />

      <ResultsModal
        open={showResults}
        score={score}
        results={results}
        onShare={handleShare}
        onPlayAgain={loadRandom}
        onClose={() => setShowResults(false)}
        loadingNext={loadingNext}
      />
    </div>
  );
}

export default function GameBoard({
  initialGame,
}: {
  initialGame: GamePayload;
}) {
  return (
    <ToastProvider>
      <Game initialGame={initialGame} />
    </ToastProvider>
  );
}
