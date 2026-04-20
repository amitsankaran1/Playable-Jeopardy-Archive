"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";

export type ResultMark = "✅" | "❌" | "⬜";

function verdict(score: number, correct: number, total: number) {
  const pct = total === 0 ? 0 : correct / total;
  if (score <= 0) return { emoji: "🫠", title: "Rough round." };
  if (pct >= 0.8) return { emoji: "🏆", title: "Champion form!" };
  if (pct >= 0.6) return { emoji: "🔥", title: "Solid showing." };
  if (pct >= 0.4) return { emoji: "👏", title: "Not bad at all." };
  return { emoji: "🎯", title: "Back at it tomorrow." };
}

export function ResultsModal({
  open,
  score,
  results,
  onShare,
  onPlayAgain,
  onClose,
  loadingNext,
}: {
  open: boolean;
  score: number;
  results: ResultMark[];
  onShare: () => void;
  onPlayAgain: () => void;
  onClose: () => void;
  loadingNext: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const correct = results.filter((r) => r === "✅").length;
  const { emoji, title } = verdict(score, correct, results.length);
  const negative = score < 0;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="results-overlay"
            className="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            key="results-modal"
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="results-title"
            initial={{ opacity: 0, scale: 0.9, x: "-50%", y: "calc(-50% + 20px)" }}
            animate={{ opacity: 1, scale: 1, x: "-50%", y: "-50%" }}
            exit={{ opacity: 0, scale: 0.94, x: "-50%", y: "calc(-50% + 10px)" }}
            transition={{ type: "spring", stiffness: 380, damping: 32 }}
          >
            <div className="modal-body">
              <button
                className="modal-close"
                onClick={onClose}
                aria-label="Close results"
              >
                ×
              </button>

              <div className="results-header">
                <motion.div
                  className="results-emoji"
                  initial={{ scale: 0.6, rotate: -12, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 320, damping: 14, delay: 0.1 }}
                >
                  {emoji}
                </motion.div>
                <motion.h2
                  id="results-title"
                  className="results-title"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  {title}
                </motion.h2>
              </div>

              <motion.div
                className="results-score"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.28 }}
              >
                <div className="results-score-label">Final Score</div>
                <div className="results-score-value">
                  {negative ? "-$" : "$"}
                  {Math.abs(score).toLocaleString()}
                </div>
              </motion.div>

              <motion.div
                className="results-grid"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: {
                    transition: { staggerChildren: 0.07, delayChildren: 0.34 },
                  },
                }}
                aria-label={`Results: ${correct} of ${results.length} correct`}
              >
                {results.map((r, i) => (
                  <motion.span
                    key={i}
                    variants={{
                      hidden: { scale: 0, opacity: 0 },
                      show: {
                        scale: 1,
                        opacity: 1,
                        transition: { type: "spring", stiffness: 420, damping: 18 },
                      },
                    }}
                  >
                    {r}
                  </motion.span>
                ))}
              </motion.div>

              <motion.div
                className="btn-row"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button className="btn btn-secondary" onClick={onShare}>
                  Share
                </button>
                <button
                  className="btn btn-primary"
                  onClick={onPlayAgain}
                  disabled={loadingNext}
                >
                  {loadingNext ? (
                    <>
                      <span className="spinner on-gold" /> Loading…
                    </>
                  ) : (
                    "Play Again"
                  )}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
