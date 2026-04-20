"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  AnswerResponse,
  GamePayload,
  PublicClue,
} from "@/lib/types";

type ResultMark = "✅" | "❌" | "⬜";

interface ClueState {
  status: "unanswered" | "correct" | "wrong" | "skipped";
}

function parseValue(label: string): number {
  return parseInt(label.replace(/[^0-9]/g, ""), 10) || 0;
}

export default function GameBoard({
  initialGame,
}: {
  initialGame: GamePayload;
}) {
  const [game, setGame] = useState<GamePayload>(initialGame);
  const [clueStates, setClueStates] = useState<Record<number, ClueState>>({});
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<ResultMark[]>([]);
  const [activeClue, setActiveClue] = useState<PublicClue | null>(null);
  const [guess, setGuess] = useState("");
  const [feedback, setFeedback] = useState<{
    text: string;
    kind: "correct" | "incorrect" | "";
  }>({ text: "", kind: "" });
  const [revealedAnswer, setRevealedAnswer] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const autoCloseRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const totalClues = game.clues.length;

  useEffect(() => {
    if (activeClue) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      if (autoCloseRef.current) clearTimeout(autoCloseRef.current);
    };
  }, [activeClue]);

  useEffect(() => {
    if (results.length === totalClues && totalClues > 0) {
      setShowResults(true);
    }
  }, [results.length, totalClues]);

  const resetGameState = useCallback(() => {
    setClueStates({});
    setScore(0);
    setResults([]);
    setActiveClue(null);
    setGuess("");
    setFeedback({ text: "", kind: "" });
    setRevealedAnswer(null);
    setShowResults(false);
  }, []);

  const openClue = (clue: PublicClue) => {
    if (clueStates[clue.id]?.status && clueStates[clue.id].status !== "unanswered") return;
    setActiveClue(clue);
    setGuess("");
    setFeedback({ text: "", kind: "" });
    setRevealedAnswer(null);
  };

  const closeClue = useCallback(() => {
    if (autoCloseRef.current) {
      clearTimeout(autoCloseRef.current);
      autoCloseRef.current = null;
    }
    setActiveClue(null);
    setSubmitting(false);
  }, []);

  const finishClue = useCallback(
    (clue: PublicClue, outcome: "correct" | "wrong" | "skipped", answer: string) => {
      const value = parseValue(clue.value);
      setClueStates((prev) => ({ ...prev, [clue.id]: { status: outcome } }));
      setRevealedAnswer(answer);
      if (outcome === "correct") {
        setScore((s) => s + value);
        setResults((r) => [...r, "✅"]);
        setFeedback({ text: "Correct!", kind: "correct" });
      } else if (outcome === "wrong") {
        setScore((s) => s - value);
        setResults((r) => [...r, "❌"]);
        setFeedback({ text: "Not quite…", kind: "incorrect" });
      } else {
        setResults((r) => [...r, "⬜"]);
        setFeedback({ text: "", kind: "" });
      }
      autoCloseRef.current = setTimeout(closeClue, 2000);
    },
    [closeClue],
  );

  const submitGuess = async () => {
    if (!activeClue || submitting) return;
    const typed = guess.trim();
    if (!typed) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clueId: activeClue.id, guess: typed }),
      });
      const data = (await res.json()) as AnswerResponse;
      finishClue(
        activeClue,
        data.correct ? "correct" : "wrong",
        data.correctAnswer,
      );
    } catch {
      setFeedback({ text: "Connection error — try again.", kind: "incorrect" });
      setSubmitting(false);
    }
  };

  const skipGuess = async () => {
    if (!activeClue || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clueId: activeClue.id, guess: "" }),
      });
      const data = (await res.json()) as AnswerResponse;
      finishClue(activeClue, "skipped", data.correctAnswer);
    } catch {
      setFeedback({ text: "Connection error — try again.", kind: "incorrect" });
      setSubmitting(false);
    }
  };

  const shareText = useMemo(() => {
    return [
      `Daily Double (${game.shareDate})`,
      game.category.name,
      `Score: $${score}`,
      results.join(""),
    ]
      .join("\n")
      .trim();
  }, [game.shareDate, game.category.name, score, results]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ text: shareText });
      } catch {
        /* user dismissed */
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(shareText);
      alert("Results copied to clipboard!");
    } catch {
      alert("Failed to copy results");
    }
  };

  const loadRandom = async () => {
    setLoadingNext(true);
    try {
      const res = await fetch("/api/game/random", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load");
      const next = (await res.json()) as GamePayload;
      resetGameState();
      setGame(next);
    } catch {
      alert("Couldn't load another category — try again.");
    } finally {
      setLoadingNext(false);
    }
  };

  const gameComplete = results.length === totalClues;

  return (
    <>
      <h1>Daily Double</h1>
      <div className="date">{game.dateLabel}</div>

      <div className="score-display">
        Score: $<span id="current-score">{score}</span>
        {gameComplete && (
          <>
            <button onClick={handleShare} id="share-results">
              Share Results
            </button>
            <button
              className="play-again-button"
              onClick={loadRandom}
              disabled={loadingNext}
            >
              {loadingNext ? "Loading…" : "Play Again"}
            </button>
          </>
        )}
      </div>

      <div className="category-container">
        <h2>{game.category.name}</h2>
        <div className="clues-list">
          {game.clues.map((clue) => {
            const state = clueStates[clue.id]?.status ?? "unanswered";
            const classes = ["clue-card"];
            if (state !== "unanswered") classes.push("answered");
            if (state === "correct") classes.push("correct");
            if (state === "wrong") classes.push("wrong");
            if (state === "skipped") classes.push("skipped");
            return (
              <div
                key={clue.id}
                className={classes.join(" ")}
                data-id={clue.id}
                onClick={() => openClue(clue)}
              >
                <div className="clue-value">{clue.value}</div>
              </div>
            );
          })}
        </div>
      </div>

      {activeClue && (
        <>
          <div
            className="overlay"
            style={{ display: "block" }}
            onClick={closeClue}
          />
          <div className="popup" style={{ display: "block" }}>
            <div className="popup-content">
              <span className="close-btn" onClick={closeClue}>
                ×
              </span>
              <p className="popup-question">{activeClue.question}</p>
              <div className="guess-container">
                <div className="input-row">
                  <input
                    ref={inputRef}
                    type="text"
                    id="guess-input"
                    placeholder="Enter your answer..."
                    autoComplete="off"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitGuess();
                    }}
                    disabled={submitting}
                  />
                  <button
                    className={`submit-guess-btn${submitting ? " disabled" : ""}`}
                    onClick={submitGuess}
                    disabled={submitting}
                  >
                    Submit
                  </button>
                </div>
                <div className="skip-container">
                  <button
                    className={`skip-btn${submitting ? " disabled" : ""}`}
                    onClick={skipGuess}
                    disabled={submitting}
                  >
                    Skip
                  </button>
                </div>
                {feedback.text && (
                  <p className={`feedback-message ${feedback.kind}`}>
                    {feedback.text}
                  </p>
                )}
              </div>
              {revealedAnswer && (
                <p className="popup-answer" style={{ display: "block" }}>
                  {revealedAnswer}
                </p>
              )}
            </div>
          </div>
        </>
      )}

      {showResults && (
        <>
          <div className="overlay" style={{ display: "block" }} />
          <div className="results-popup" style={{ display: "block" }}>
            <div className="popup-content">
              <h2>Game Complete!</h2>
              <div className="final-score">
                Score: $<span className="final-score-value">{score}</span>
              </div>
              <div className="results-grid">{results.join(" ")}</div>
              <button className="share-button" onClick={handleShare}>
                Share Results
              </button>
              <button
                className="play-again-button"
                onClick={loadRandom}
                disabled={loadingNext}
              >
                {loadingNext ? "Loading…" : "Play Again"}
              </button>
              <button
                className="close-results-btn"
                onClick={() => setShowResults(false)}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      <div className="game-info">
        <div className="game-info-content">
          <h3>Original Game Information</h3>
          <p>
            Season {game.gameDetails.seasonId ?? "?"}, Game #
            {game.gameDetails.gameNumber ?? "?"}
          </p>
          <p>Air Date: {game.gameDetails.date || "Unknown"}</p>
        </div>
      </div>

      <div className="disclaimer">
        <p>
          This game was created by a fan and is intended for recreational use
          only. The Jeopardy! game show and all elements thereof, including but
          not limited to copyright and trademark thereto, are the property of
          Jeopardy Productions, Inc. and are protected under law. This website
          is not affiliated with, sponsored by, or operated by Jeopardy
          Productions, Inc.
        </p>
      </div>
    </>
  );
}
