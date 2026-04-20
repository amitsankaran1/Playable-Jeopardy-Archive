"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { PublicClue } from "@/lib/types";

export type Outcome = "correct" | "wrong" | "skipped";

export interface ClueResult {
  outcome: Outcome;
  correctAnswer: string;
}

export function ClueModal({
  clue,
  result,
  submitting,
  onClose,
  onSubmit,
  onSkip,
}: {
  clue: PublicClue | null;
  result: ClueResult | null;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (guess: string) => void;
  onSkip: () => void;
}) {
  const [guess, setGuess] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (clue) {
      setGuess("");
      const t = setTimeout(() => inputRef.current?.focus(), 180);
      return () => clearTimeout(t);
    }
  }, [clue?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!clue) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [clue, onClose]);

  return (
    <AnimatePresence>
      {clue && (
        <>
          <motion.div
            key="overlay"
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            key="modal"
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="clue-question"
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "calc(-50% + 20px)" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.94, x: "-50%", y: "calc(-50% + 10px)" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="modal-body">
              <button
                className="modal-close"
                onClick={onClose}
                aria-label="Close clue"
              >
                ×
              </button>

              {clue.isDailyDouble ? (
                <motion.div
                  className="dd-banner"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  Daily Double · {clue.value}
                </motion.div>
              ) : (
                <div className="modal-eyebrow">Clue · {clue.value}</div>
              )}

              <p id="clue-question" className="modal-question">
                {clue.question}
              </p>

              {!result && (
                <motion.form
                  className="guess-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const v = guess.trim();
                    if (!v || submitting) return;
                    onSubmit(v);
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <input
                    ref={inputRef}
                    className="guess-input"
                    placeholder="What is…"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    disabled={submitting}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="send"
                  />
                  <div className="btn-row btn-row-primary">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting || !guess.trim()}
                    >
                      {submitting ? (
                        <>
                          <span className="spinner on-gold" />
                          Checking…
                        </>
                      ) : (
                        "Submit"
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={onSkip}
                      disabled={submitting}
                    >
                      Skip
                    </button>
                  </div>
                </motion.form>
              )}

              {result && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ display: "flex", flexDirection: "column", gap: "var(--s-3)" }}
                >
                  <div
                    className={`feedback ${
                      result.outcome === "correct"
                        ? "correct"
                        : result.outcome === "wrong"
                        ? "incorrect"
                        : "neutral"
                    }`}
                  >
                    {result.outcome === "correct" && "✓  Correct!"}
                    {result.outcome === "wrong" && "✕  Not quite."}
                    {result.outcome === "skipped" && "Skipped."}
                  </div>
                  <div className="answer-reveal">
                    <div className="answer-reveal-label">Answer</div>
                    <p className="answer-reveal-text">{result.correctAnswer}</p>
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={onClose}
                    autoFocus
                  >
                    Continue
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
