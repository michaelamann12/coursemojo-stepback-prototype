import { useEffect, useState } from "preact/hooks";
import { Slide } from "../Slide.tsx";
import {
  loadAllTimelines,
  computePerformanceRollup,
  blockerTierLabel,
  type PerformanceRollup,
} from "@lib/deckData.ts";

const fmtPctRaw = (n: number) => `${Math.round(n)}%`;
const fmtInt = (n: number) => n.toLocaleString();

const BLOCKER_LABELS: Record<string, string> = {
  task: "Task — unclear what's being asked",
  vocabulary: "Vocabulary",
  syntax: "Syntax",
  "background-knowledge": "Background knowledge",
  "comprehend-text": "Comprehending the text",
  "cite-evidence": "Citing evidence",
  "analyze-character": "Analyzing character",
  "analyze-craft": "Analyzing craft",
  "analyze-theme": "Analyzing theme",
  "compare-contrast": "Comparing & contrasting",
  "analyze-argument": "Analyzing argument",
  synthesize: "Synthesizing",
  focus: "Focus",
  evidence: "Using evidence in writing",
  development: "Developing ideas",
  organization: "Organization",
};
function blockerLabel(b: string): string {
  return BLOCKER_LABELS[b] ?? b;
}

/** Slide 18 — Performance Snapshot. */
export function PerformanceSnapshotSlide() {
  const [data, setData] = useState<PerformanceRollup | null>(null);
  useEffect(() => {
    loadAllTimelines().then((tl) => setData(computePerformanceRollup(tl)));
  }, []);

  return (
    <Slide
      eyebrow="Data Review · Performance"
      title="Where students are mastering — and where they're stuck."
      lead="District-wide answers across every Mojo question, scaffolded retries included."
    >
      {!data ? <div class="deck-loading">Loading…</div> : <Body d={data} />}
    </Slide>
  );
}

function Body({ d }: { d: PerformanceRollup }) {
  const eventuallyMastered = d.avgPctCorrectFirst + d.avgPctCorrectAfterScaffolding;
  const relativeLift =
    d.avgPctCorrectFirst > 0
      ? (d.avgPctCorrectAfterScaffolding / d.avgPctCorrectFirst) * 100
      : 0;
  const top5 = d.topBlockers.slice(0, 5);
  const maxBlockerCount = top5[0]?.count ?? 1;

  return (
    <div class="perf-grid">
      <div class="perf-row-stats">
        <div class="perf-hero">
          <div class="perf-hero-eyebrow">The lift from AI scaffolding</div>
          <div class="perf-hero-value">+{fmtPctRaw(relativeLift)}</div>
          <div class="perf-hero-sub">
            relative gain in mastery — Mojo guides students from{" "}
            <strong>{fmtPctRaw(d.avgPctCorrectFirst)}</strong> correct on first try
            to <strong>{fmtPctRaw(eventuallyMastered)}</strong> after scaffolded retry
          </div>
        </div>
        <div class="perf-side-stats">
          <div class="usage-stat">
            <span class="usage-stat-value">{fmtPctRaw(eventuallyMastered)}</span>
            <div class="usage-stat-label">Reach mastery</div>
            <div class="usage-stat-sub">incl. scaffolded retries</div>
          </div>
          <div class="usage-stat usage-stat--coral">
            <span class="usage-stat-value">{fmtPctRaw(d.avgPctNeverCorrect)}</span>
            <div class="usage-stat-label">Coaching opportunities</div>
            <div class="usage-stat-sub">students flagged for teacher follow-up</div>
          </div>
        </div>
      </div>

      <div class="perf-blockers">
        <h3 class="perf-blockers-title">Top blockers across the district</h3>
        <p class="perf-blockers-sub">
          When students stall, this is what's getting in the way. Tier shows where
          the blocker sits in the access → analyze → communicate progression.
        </p>
        {top5.length > 0 ? (
          <div class="perf-blockers-list">
            {top5.map((b) => {
              const w = Math.round((b.count / maxBlockerCount) * 100);
              return (
                <div class="perf-blocker-row" key={b.blocker}>
                  <div class="perf-blocker-label">
                    <span class={`perf-blocker-tier perf-blocker-tier--${b.tier}`}>
                      Tier {b.tier} · {blockerTierLabel(b.tier)}
                    </span>
                    <span class="perf-blocker-name">{blockerLabel(b.blocker)}</span>
                  </div>
                  <div class="perf-blocker-track">
                    <div class="perf-blocker-fill" style={{ width: `${w}%` }} />
                  </div>
                  <div class="perf-blocker-count">{fmtInt(b.count)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div class="perf-blockers-empty">
            Blocker tagging is not yet populated in the synthetic dataset. Once the
            data pipeline assigns canonical blockers to incorrect responses, the top
            5 will surface here automatically.
          </div>
        )}
      </div>
    </div>
  );
}
