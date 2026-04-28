import { useEffect, useState } from "preact/hooks";
import { Slide } from "../Slide.tsx";
import {
  loadAllTimelines,
  computeGrowthRollup,
  type GrowthRollup,
} from "@lib/deckData.ts";

const fmtPctRaw = (n: number) => `${Math.round(n)}%`;

/** Slide 15 — Growth detail. Three buckets, three metrics each, side-by-side bars. */
export function GrowthDetailSlide() {
  const [g, setG] = useState<GrowthRollup | null>(null);
  useEffect(() => {
    loadAllTimelines().then((tl) => setG(computeGrowthRollup(tl)));
  }, []);

  return (
    <Slide
      eyebrow="Data Review · Growth"
      title="Growth across the year"
      lead="How student performance shifted from early activities to recent ones — across the whole district."
    >
      {!g ? (
        <div class="deck-loading">Loading…</div>
      ) : (
        <div class="growth-detail-grid">
          {g.buckets.map((b, i) => {
            const mastered = b.avgPctCorrectFirst + b.avgPctCorrectAfterScaffolding;
            return (
              <div class={`growth-bucket-card ${i === g.buckets.length - 1 ? "growth-bucket-card--latest" : ""}`} key={b.label}>
                <div class="growth-bucket-label">{b.label}</div>
                <div class="growth-bucket-meta">{b.activities} activities</div>
                <div class="growth-bucket-rows">
                  <BucketRow label="Correct first try" value={b.avgPctCorrectFirst} />
                  <BucketRow label="Mastered (incl. scaffolded)" value={mastered} accent />
                  <BucketRow label="Never reached correct" value={b.avgPctNeverCorrect} muted />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Slide>
  );
}

function BucketRow({ label, value, accent, muted }: { label: string; value: number; accent?: boolean; muted?: boolean }) {
  const pct = Math.max(1, Math.round(value));
  let cls = "growth-bucket-fill";
  if (accent) cls += " growth-bucket-fill--accent";
  if (muted) cls += " growth-bucket-fill--muted";
  return (
    <div class="growth-bucket-row">
      <div class="growth-bucket-row-label">{label}</div>
      <div class="growth-bucket-row-track">
        <div class={cls} style={{ width: `${pct}%` }} />
      </div>
      <div class="growth-bucket-row-val">{fmtPctRaw(value)}</div>
    </div>
  );
}
