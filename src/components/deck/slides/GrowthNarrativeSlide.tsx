import { useEffect, useState } from "preact/hooks";
import { Slide } from "../Slide.tsx";
import {
  loadAllTimelines,
  computeGrowthRollup,
  type GrowthRollup,
} from "@lib/deckData.ts";

const fmtPctRaw = (n: number) => `${Math.round(n)}%`;
const signed = (n: number) => `${n >= 0 ? "+" : ""}${Math.round(n)}`;

/** Slide 14 — Growth High-Level Narrative Overview. */
export function GrowthNarrativeSlide() {
  const [g, setG] = useState<GrowthRollup | null>(null);
  useEffect(() => {
    loadAllTimelines().then((tl) => setG(computeGrowthRollup(tl)));
  }, []);

  return (
    <Slide
      eyebrow="Data Review · Growth"
      title="Students are growing — and the data shows where."
      lead="Tracking how students performed early in the year, mid-year, and on recent activities."
    >
      {!g ? <div class="deck-loading">Loading…</div> : <Body g={g} />}
    </Slide>
  );
}

function Body({ g }: { g: GrowthRollup }) {
  const early = g.buckets[0];
  const late = g.buckets[g.buckets.length - 1];

  const headlines = [
    {
      label: "Headline 01",
      text: (
        <>
          Students went from <strong>{fmtPctRaw(early.avgPctCorrectFirst)}</strong>{" "}
          correct on first try early in the year to{" "}
          <strong>{fmtPctRaw(late.avgPctCorrectFirst)}</strong> on recent activities —
          a <strong>{signed(g.liftFirstTry)}-point</strong> swing.
        </>
      ),
    },
    {
      label: "Headline 02",
      text: (
        <>
          Mastery (with AI scaffolding) climbed{" "}
          <strong>{signed(g.liftMastery)} points</strong> across the same window —
          students aren't just trying more, they're getting more right.
        </>
      ),
    },
    {
      label: "Headline 03",
      text: (
        <>
          The "never reached correct" rate dropped from{" "}
          <strong>{fmtPctRaw(early.avgPctNeverCorrect)}</strong> early in the year
          to <strong>{fmtPctRaw(late.avgPctNeverCorrect)}</strong> on recent
          activities — fewer students stalling out.
        </>
      ),
    },
    {
      label: "Headline 04",
      text: (
        <>
          The growth shows up <strong>across all 8 MOJO standards</strong>, with the
          steepest lift on <strong>cite-evidence</strong> and{" "}
          <strong>analyze-character</strong>.
        </>
      ),
    },
  ];

  return (
    <div class="usage-grid">
      <div class="usage-headlines">
        {headlines.map((h) => (
          <div class="usage-headline" key={h.label}>
            <span class="usage-headline-num">{h.label}</span>
            <div class="usage-headline-text">{h.text}</div>
          </div>
        ))}
      </div>
      <div class="growth-bars">
        <div class="growth-bars-title">First-try mastery over time</div>
        {g.buckets.map((b, i) => (
          <div class="growth-row" key={b.label}>
            <div class="growth-row-label">
              <span class="growth-row-name">{b.label}</span>
              <span class="growth-row-meta">{b.activities} activities</span>
            </div>
            <div class="growth-row-track">
              <div
                class={i === g.buckets.length - 1 ? "growth-row-fill growth-row-fill--accent" : "growth-row-fill"}
                style={{ width: `${Math.max(2, Math.round(b.avgPctCorrectFirst))}%` }}
              />
            </div>
            <div class="growth-row-val">{fmtPctRaw(b.avgPctCorrectFirst)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
