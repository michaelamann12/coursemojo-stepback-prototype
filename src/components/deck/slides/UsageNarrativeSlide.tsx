import { useEffect, useState } from "preact/hooks";
import { Slide } from "../Slide.tsx";
import {
  loadAllTimelines,
  computeUsageRollup,
  type UsageRollup,
} from "@lib/deckData.ts";

const STANDARD_LABELS: Record<string, string> = {
  "MOJO.CITE-EVIDENCE": "Cite Evidence",
  "MOJO.ANALYZE-CHARACTER": "Analyze Character",
  "MOJO.ANALYZE-CRAFT": "Analyze Craft",
  "MOJO.ANALYZE-THEME": "Analyze Theme",
  "MOJO.ANALYZE-ARGUMENT": "Analyze Argument",
  "MOJO.COMPARE-CONTRAST": "Compare & Contrast",
  "MOJO.WRITE-ARGUMENT": "Write Argument",
  "MOJO.SYNTHESIZE": "Synthesize",
};

function shortLabel(std: string): string {
  return STANDARD_LABELS[std] ?? std.replace(/^MOJO\./, "");
}

const fmtPct = (n: number) => `${Math.round(n * 100)}%`;
const fmtInt = (n: number) => n.toLocaleString();

/**
 * Slide 12 — Usage High-Level Narrative Overview.
 *
 * Mirrors the deck spec: 3-4 plain-English headlines down the left column,
 * 3-4 supporting positive data points as stat cards on the right.
 */
export function UsageNarrativeSlide() {
  const [data, setData] = useState<UsageRollup | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAllTimelines()
      .then((tl) => setData(computeUsageRollup(tl)))
      .catch((e: Error) => setError(e.message));
  }, []);

  return (
    <Slide
      eyebrow="Data Review · Usage"
      title="Mojo is showing up in classrooms — at scale."
      lead="A high-level look at engagement across Prototype ISD this period."
    >
      {error ? (
        <div class="deck-error">Failed to load: {error}</div>
      ) : !data ? (
        <div class="deck-loading">Loading district data…</div>
      ) : (
        <UsageBody d={data} />
      )}
    </Slide>
  );
}

function UsageBody({ d }: { d: UsageRollup }) {
  const top2 = d.standardsCovered.slice(0, 2).map((s) => shortLabel(s.standard));
  const avgPerClass = Math.round(d.avgActivitiesPerClass);

  const headlines = [
    {
      label: "Headline 01",
      text: (
        <>
          Prototype ISD ran <strong>{fmtInt(d.totalActivities)}</strong> Mojo activities
          across <strong>{d.classroomCount} classrooms</strong> — averaging{" "}
          <strong>~{avgPerClass}</strong> activities per teacher.
        </>
      ),
    },
    {
      label: "Headline 02",
      text: (
        <>
          <strong>{fmtPct(d.pctActivitiesWith60PctCompletion)}</strong> of activities
          reached <strong>≥60% student completion</strong>, signalling consistent
          classroom uptake.
        </>
      ),
    },
    {
      label: "Headline 03",
      text: (
        <>
          <strong>{fmtInt(d.studentsReachedTargetTask)}</strong> students reached
          the target task across all activities — <strong>{fmtPct(d.pctScoredAmongReached)}</strong>{" "}
          scored correctly when they got there.
        </>
      ),
    },
    {
      label: "Headline 04",
      text: (
        <>
          All <strong>8 MOJO standards</strong> are being practiced district-wide —
          heaviest lift on{" "}
          <strong>{top2[0] ?? "—"}</strong>
          {top2[1] ? <> and <strong>{top2[1]}</strong></> : null}.
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

      <div class="usage-stats">
        <Stat
          value={fmtInt(d.totalActivities)}
          label="Activities run"
          sub={`across ${d.classroomCount} classrooms`}
        />
        <Stat
          value={fmtPct(d.avgResponseRate)}
          label="Avg active engagement"
          sub="of students who started, answered"
          coral
        />
        <Stat
          value={fmtPct(d.pctActivitiesWith60PctCompletion)}
          label="Activities ≥ 60% complete"
          sub={`${fmtInt(d.activitiesWith60PctCompletion)} of ${fmtInt(d.totalActivities)}`}
        />
        <Stat
          value={fmtInt(d.studentsScoredOnTargetTask)}
          label="Target-task scores"
          sub={`${fmtPct(d.pctScoredAmongReached)} of those who reached it`}
          coral
        />
      </div>
    </div>
  );
}

function Stat({
  value,
  label,
  sub,
  coral,
}: {
  value: string;
  label: string;
  sub?: string;
  coral?: boolean;
}) {
  return (
    <div class={coral ? "usage-stat usage-stat--coral" : "usage-stat"}>
      <div>
        <span class="usage-stat-value">{value}</span>
      </div>
      <div class="usage-stat-label">{label}</div>
      {sub ? <div class="usage-stat-sub">{sub}</div> : null}
    </div>
  );
}
