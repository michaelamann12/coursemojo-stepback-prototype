import { useEffect, useState } from "preact/hooks";
import type { ComponentChildren } from "preact";
import "@styles/deck.css";

interface DeckShellProps {
  slides: { id: string; render: () => ComponentChildren }[];
  initial?: number;
}

/**
 * Click-through deck container. Renders one slide at a time inside a 16:9
 * frame that scales to viewport. Arrow keys + on-screen buttons navigate.
 */
export function DeckShell({ slides, initial = 0 }: DeckShellProps) {
  const [i, setI] = useState(initial);
  const total = slides.length;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        setI((cur) => Math.min(total - 1, cur + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        setI((cur) => Math.max(0, cur - 1));
      } else if (e.key === "Home") {
        setI(0);
      } else if (e.key === "End") {
        setI(total - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  const current = slides[i];

  return (
    <div class="deck-stage">
      <div class="deck-frame">{current.render()}</div>
      <div class="deck-nav" aria-label="Deck navigation">
        <button
          type="button"
          class="deck-nav-btn"
          onClick={() => setI((cur) => Math.max(0, cur - 1))}
          disabled={i === 0}
          aria-label="Previous slide"
        >
          ◀
        </button>
        <span class="deck-nav-counter">
          {i + 1} / {total}
        </span>
        <button
          type="button"
          class="deck-nav-btn"
          onClick={() => setI((cur) => Math.min(total - 1, cur + 1))}
          disabled={i === total - 1}
          aria-label="Next slide"
        >
          ▶
        </button>
      </div>
    </div>
  );
}
