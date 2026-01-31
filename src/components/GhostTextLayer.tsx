import React, { useMemo } from "react";

const WORD_SETS: Record<string, string[]> = {
  explore: ["explore", "discover", "consider", "wonder", "map", "survey"],
  filter: ["compare", "weigh", "balance", "prioritize", "decide"],
  empty: ["pause", "rethink", "adjust", "expand", "try another path"],
  shortlist: ["choose", "prepare", "commit", "shape", "plan"],
  verify: ["verify", "confirm", "document", "protect", "understand"],
  action: ["begin", "move", "build", "arrive", "start again"],
};

// Recommendation: make this list either fully public-domain fragments
// OR fully original copy. Mixing both will feel inconsistent.
const TEXTURE_FRAGMENTS = [
  "to sail beyond the sunset",
  "the lights begin to twinkle",
  "the unplumbed, salt, estranging sea",
  "the road is before us",
  "a map of the world",
  "return to the source",
  "the turning tide",
  "across the water",
];

const seededRandom = (seed: number) => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

const hashSeed = (s: string) => {
  let seed = 0;
  for (let i = 0; i < s.length; i++) {
    seed = ((seed << 5) - seed) + s.charCodeAt(i);
    seed |= 0;
  }
  return seed;
};

const serifStack =
  "var(--font-serif), ui-serif, Georgia, Cambria, 'Times New Roman', Times, serif";

const getWordStyle = (key: string, index: number) => {
  const seed = hashSeed(key);
  const r1 = seededRandom(seed);
  const r2 = seededRandom(seed + 1);
  const r3 = seededRandom(seed + 2);
  const r4 = seededRandom(seed + 3);

  const leftPos = (r1 * 100) - 10;
  const topPos = (r2 * 100) - 10;

  const fontSize = (5.5 + (r3 * 3.5)).toFixed(2) + "rem"; // slightly smaller
  const rotation = (r4 * 4) - 2;

  return {
    top: `${topPos}%`,
    left: `${leftPos}%`,
    fontSize,
    transform: `rotate(${rotation}deg)`,
    fontFamily: serifStack,
    // softer than per-element blur, cheaper to render
    textShadow: "0 0 1px currentColor",
  } as const;
};

const getMicroStyle = (key: string, index: number) => {
  const seed = hashSeed(key);
  const r1 = seededRandom(seed);
  const r2 = seededRandom(seed + 1);
  const r3 = seededRandom(seed + 2);
  const r4 = seededRandom(seed + 3);

  const leftPos = (r1 * 110) - 5;
  const topPos = (r2 * 110) - 5;

  const fontSize = (0.75 + (r3 * 0.5)).toFixed(2) + "rem";
  const rotation = (r4 * 10) - 5;

  return {
    top: `${topPos}%`,
    left: `${leftPos}%`,
    fontSize,
    transform: `rotate(${rotation}deg)`,
    fontFamily: serifStack,
    fontStyle: "italic",
    letterSpacing: "0.01em",
    whiteSpace: "nowrap",
  } as const;
};

export function GhostTextLayer({ state = "explore" }: { state?: string }) {
  const activeSet = WORD_SETS[state] || WORD_SETS.explore;

  const { words, fragments } = useMemo(() => {
    return {
      words: activeSet.slice(0, 6),
      fragments: TEXTURE_FRAGMENTS.slice(0, 8),
    };
  }, [state]); // only depends on state, avoids re-render churn

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none"
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        zIndex: -1, // safer "always behind" default
      }}
    >
      {/* Micro-text layer */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.03 }}>
        {fragments.map((text, index) => {
          const key = `micro-${state}-${text}-${index}`;
          return (
            <span
              key={key}
              style={{ position: "absolute", ...getMicroStyle(key, index) }}
              className="text-ink"
            >
              {text}
            </span>
          );
        })}
      </div>

      {/* Primary verb layer */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.05 }}>
        {words.map((word, index) => {
          const key = `${state}-${word}-${index}`;
          return (
            <span
              key={key}
              style={{ position: "absolute", ...getWordStyle(key, index) }}
              className="text-ink whitespace-nowrap"
            >
              {word}
            </span>
          );
        })}
      </div>
    </div>
  );
}
