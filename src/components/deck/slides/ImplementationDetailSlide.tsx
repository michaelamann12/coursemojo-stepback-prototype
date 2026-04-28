import { useEffect, useState } from "preact/hooks";
import { Slide } from "../Slide.tsx";
import {
  loadAllTimelines,
  computeImplementationRollup,
  type ImplementationRollup,
  type FeatureUsage,
} from "@lib/deckData.ts";

const fmtPct = (n: number) => `${Math.round(n * 100)}%`;
const fmtInt = (n: number) => n.toLocaleString();

/** Slide 17 — Implementation detail. Frequency of every tool/app across district. */
export function ImplementationDetailSlide() {
  const [data, setData] = useState<ImplementationRollup | null>(null);
  useEffect(() => {
    loadAllTimelines().then((tl) => setData(computeImplementationRollup(tl)));
  }, []);

  return (
    <Slide
      eyebrow="Data Review · Implementation"
      title="Tool & app usage across the district"
      lead="Frequency of teacher actions across all activities, split by post-activity tools and in-session app moves."
    >
      {!data ? (
        <div class="deck-loading">Loading…</div>
      ) : (
        <div class="impl-grid">
          <FeaturePanel
            title="Post-activity tools"
            subtitle="Tools teachers use to debrief and act on Mojo data"
            features={data.features.filter((f) => f.category === "tool").sort((a, b) => b.pctActivitiesUsed - a.pctActivitiesUsed)}
            total={data.totalActivities}
            accent="coral"
          />
          <FeaturePanel
            title="In-session app usage"
            subtitle="Mid-session moves teachers make to steer time and watch progress"
            features={data.features.filter((f) => f.category === "app").sort((a, b) => b.pctActivitiesUsed - a.pctActivitiesUsed)}
            total={data.totalActivities}
            accent="purple"
          />
        </div>
      )}
    </Slide>
  );
}

function FeaturePanel({
  title,
  subtitle,
  features,
  total,
  accent,
}: {
  title: string;
  subtitle: string;
  features: FeatureUsage[];
  total: number;
  accent: "coral" | "purple";
}) {
  return (
    <div class={`impl-panel impl-panel--${accent}`}>
      <h3 class="impl-panel-title">{title}</h3>
      <p class="impl-panel-sub">{subtitle}</p>
      <div class="impl-bars">
        {features.map((f) => (
          <FeatureBar key={f.key} feature={f} total={total} accent={accent} />
        ))}
      </div>
    </div>
  );
}

function FeatureBar({
  feature,
  total,
  accent,
}: {
  feature: FeatureUsage;
  total: number;
  accent: "coral" | "purple";
}) {
  const pct = Math.round(feature.pctActivitiesUsed * 100);
  return (
    <div class="impl-bar-row">
      <div class="impl-bar-label">
        <span class="impl-bar-name">{feature.label}</span>
        <span class="impl-bar-meta">
          {fmtPct(feature.pctActivitiesUsed)} · {fmtInt(feature.activitiesUsed)}/{fmtInt(total)}
        </span>
      </div>
      <div class="impl-bar-track">
        <div class={`impl-bar-fill impl-bar-fill--${accent}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
