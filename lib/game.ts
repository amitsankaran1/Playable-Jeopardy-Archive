import { createHash } from "node:crypto";
import type { Round } from "./types";

export function getEasternDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  return `${year}${month}${day}`;
}

export function getCategoryIndex(dateStr: string, total: number): number {
  const hex = createHash("sha256").update(dateStr).digest("hex").slice(0, 8);
  return parseInt(hex, 16) % total;
}

const JEOPARDY_VALUES = ["$200", "$400", "$600", "$800", "$1000"] as const;
const DOUBLE_VALUES = ["$400", "$800", "$1200", "$1600", "$2000"] as const;

export function assignClueValues(round: Round, count: number): string[] {
  const table = round === "Double Jeopardy" ? DOUBLE_VALUES : JEOPARDY_VALUES;
  return Array.from({ length: count }, (_, i) => table[i] ?? "$0");
}

export function formatDateLabel(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(now);
}

export function formatShareDate(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).formatToParts(now);
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;
  const year = parts.find((p) => p.type === "year")!.value;
  return `${month}/${day}/${year}`;
}
