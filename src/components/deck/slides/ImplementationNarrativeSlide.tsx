import { useEffect, useState } from "preact/hooks";
import { Slide } from "../Slide.tsx";
import {
  loadAllTimelines,
  computeImplementationRollup,
  type ImplementationRollup,
} from "@lib/deckData.ts";

const fmtPct = (n: number) => `${Math.round(n * 100)}%`;
const fmtInt = (n: number) => n.toLocaleString();

/** Slide 16 — Implementation High-Level Narrative Overview. */
export function ImplementationNarrativeSlide() {
  const [data, setData] = useState<ImplementationRollup | null>(null);
  useEffect(() => {
    loadAllTimelines().then((tl) => setData(computeImplementationRollup(tl)));
  }, []);

  return (
    <Slide
      eyebrow="Data Review · Implementation"
      title="Teachers are running Mojo, not just assigning it."
      lead="What teachers are *doing* during and after Mojo activities — across Prototype ISD."
    >
      {!data ? <div class="deck-loading">Loading…</div> : <Body d={data} />}
    </Slide>
  );
}

function Body({ d }: { d: ImplementationRollup }) {
  const tools = d.features.filter((f) => f.category === "tool").sort((a, b) => b.pctActivitiesUsed - a.pctActivitiesUsed);
  const apps = d.features.filter((f) => f.category === "app").sort((a, b) => b.pctActivitiesUsed - a.pctActivitiesUsed);
  const topTool = tools[0];
  const secondTool = tools[1];
  const topApp = apps[0];

  const headlines = [
    {
      label: "Headline 01",
      text: (
        <>
          Across <strong>{fmtInt(d.totalActivities)}</strong> activities, teachers
          touched at least one Mojo classroom tool — most often during or right after
          a session.
        </>
      ),
    },
    topTool ? {
      label: "Headline 02",
      text: (
        <>
          The most-used tool is the <strong>{topTool.label}</strong>, leveraged in{" "}
          <strong>{fmtPct(topTool.pctActivitiesUsed)}</strong> of activities — teachers
          are debriefing the data, not just collecting it.
        </>
      ),
    } : null,
    secondTool ? {
      label: "Headline 03",
      text: (
        <>
          The <strong>{secondTool.label}</strong> shows up in{" "}
          <strong>{fmtPct(secondTool.pctActivitiesUsed)}</strong> of activities,
          targeting students who needed extra support.
        </>
      ),
    } : null,
    topApp ? {
      label: "Headline 04",
      text: (
        <>
          On the in-session side, teachers most often <strong>{topApp.label.toLowerCase()}</strong>{" "}
          — used in <strong>{fmtPct(topApp.pctActivitiesUsed)}</strong> of activities to
          steer time and check student work in real time.
        </>
      ),
    } : null,
  ].filter(Boolean) as { label: string; text: preact.ComponentChildren }[];

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
        {tools.slice(0, 4).map((t) => (
          <div class="usage-stat usage-stat--coral" key={t.key}>
            <div>
              <span class="usage-stat-value">{fmtPct(t.pctActivitiesUsed)}</span>
            </div>
            <div class="usage-stat-label">{t.label}</div>
            <div class="usage-stat-sub">{fmtInt(t.activitiesUsed)} of {fmtInt(d.totalActivities)} activities</div>
          </div>
        ))}
      </div>
    </div>
  );
}
