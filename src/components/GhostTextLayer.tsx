import { JSXElementConstructor, ReactElement, ReactNode, ReactPortal, useMemo } from "react";

type GhostTextLayerProps = {
  state?: string;
  words?: string[];
  fragments?: string[];
  getWordStyle: (key: string, index: number) => React.CSSProperties;
  getMicroStyle: (key: string, index: number) => React.CSSProperties;
};

export function GhostTextLayer({
  state = "default",
  words = [],
  fragments = [],
  getWordStyle,
  getMicroStyle,
}: GhostTextLayerProps) {
  const safeWords = Array.isArray(words) ? words : [];
  const safeFragments = Array.isArray(fragments) ? fragments : [];
  console.log("GhostTextLayer props", { state, words, fragments });

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none has-texture texture-grid-01 texture-whisper"
      style={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        zIndex: -1,
        // @ts-ignore
        "--texture-opacity": 0.035,
      }}
    >
      {/* Micro-text layer */}
      <div style={{ position: "absolute", inset: 0, opacity: 0.03 }}>
        {safeFragments.map((text, index) => {
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
        {safeWords.map((word, index) => {
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
