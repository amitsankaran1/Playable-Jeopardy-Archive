import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Daily Double — A Playable Jeopardy! Archive",
  description:
    "A new trivia category every day — plus play-on-demand random categories drawn from real Jeopardy! games.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
