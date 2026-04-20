"use client";

import { motion } from "framer-motion";

export function Header({
  score,
  showScore,
}: {
  score: number;
  showScore: boolean;
}) {
  const negative = score < 0;
  return (
    <header className="topbar">
      <div className="brand">
        <div className="brand-mark">
          <span>J!</span>
        </div>
        <div className="brand-name">
          Daily <em>Double</em>
        </div>
      </div>

      {showScore && (
        <motion.div
          key={score}
          className={`score-pill ${negative ? "negative" : ""}`}
          initial={{ scale: 0.9, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 22 }}
        >
          <span className="score-pill-label">Score</span>
          <span>
            {negative ? "-$" : "$"}
            {Math.abs(score).toLocaleString()}
          </span>
        </motion.div>
      )}
    </header>
  );
}
