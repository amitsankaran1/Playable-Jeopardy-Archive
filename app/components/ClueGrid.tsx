"use client";

import { motion } from "framer-motion";
import type { PublicClue } from "@/lib/types";

export type ClueStatus = "unanswered" | "correct" | "wrong" | "skipped";

const statusIcon: Record<Exclude<ClueStatus, "unanswered">, string> = {
  correct: "✓",
  wrong: "✕",
  skipped: "—",
};

export function ClueGrid({
  categoryName,
  dateLabel,
  clues,
  getStatus,
  onSelect,
}: {
  categoryName: string;
  dateLabel: string;
  clues: PublicClue[];
  getStatus: (id: number) => ClueStatus;
  onSelect: (clue: PublicClue) => void;
}) {
  return (
    <section aria-label="Clue board">
      <motion.div
        className="category"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="category-label">{dateLabel}</div>
        <h2 className="category-name">{categoryName}</h2>
      </motion.div>

      <motion.div
        className="clue-grid"
        style={{ marginTop: "var(--s-4)" }}
        initial="hidden"
        animate="show"
        variants={{
          hidden: {},
          show: {
            transition: { staggerChildren: 0.07, delayChildren: 0.2 },
          },
        }}
      >
        {clues.map((clue) => {
          const status = getStatus(clue.id);
          const answered = status !== "unanswered";
          const classes = ["clue-card"];
          if (answered) classes.push("answered", status);
          return (
            <motion.button
              key={clue.id}
              type="button"
              className={classes.join(" ")}
              disabled={answered}
              onClick={() => onSelect(clue)}
              variants={{
                hidden: { opacity: 0, y: 16, scale: 0.94 },
                show: {
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { type: "spring", stiffness: 360, damping: 26 },
                },
              }}
              whileTap={answered ? undefined : { scale: 0.97 }}
              aria-label={
                answered
                  ? `${clue.value} — ${status}`
                  : `Select clue for ${clue.value}`
              }
            >
              {clue.isDailyDouble && !answered && (
                <span className="dd-badge" aria-hidden="true">DD</span>
              )}
              <div className="clue-value">
                {answered ? (
                  <>
                    <span aria-hidden="true">{statusIcon[status]}</span>
                    <span>{clue.value}</span>
                  </>
                ) : (
                  clue.value
                )}
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </section>
  );
}
