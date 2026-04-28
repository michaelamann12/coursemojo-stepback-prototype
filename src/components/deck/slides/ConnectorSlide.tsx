import { useEffect, useState } from "preact/hooks";
import {
  loadAllTimelines,
  computePartnershipStats,
  type PartnershipStats,
} from "@lib/deckData.ts";

const fmtInt = (n: number) => n.toLocaleString();

/** Slide 2 — Connector. Names the partnership moment with celebratory framing. */
export function ConnectorSlide() {
  const [s, setS] = useState<PartnershipStats | null>(null);
  useEffect(() => {
    loadAllTimelines().then((tl) => setS(computePartnershipStats(tl)));
  }, []);
  if (!s) {
    return (
      <div class="slide slide-title-bg">
        <div class="deck-loading">Loading…</div>
      </div>
    );
  }
  return (
    <div class="slide slide-title-bg connector-slide">
      <div class="title-eyebrow">A moment to celebrate</div>
      <h1 class="title-headline connector-headline">
        Happy <span class="connector-em">{s.monthsPartnered}-month</span> birthday
        to Prototype ISD &nbsp;×&nbsp; Mojo.
      </h1>
      <div class="connector-row">
        <div class="connector-stat">
          <div class="connector-stat-value">{s.schoolCount}</div>
          <div class="connector-stat-label">schools live</div>
        </div>
        <div class="connector-stat">
          <div class="connector-stat-value">{s.classroomCount}</div>
          <div class="connector-stat-label">classrooms running Mojo</div>
        </div>
        <div class="connector-stat">
          <div class="connector-stat-value">{fmtInt(s.approxStudents)}</div>
          <div class="connector-stat-label">students reached</div>
        </div>
        <div class="connector-stat">
          <div class="connector-stat-value">{fmtInt(s.totalActivities)}</div>
          <div class="connector-stat-label">activities run</div>
        </div>
      </div>
    </div>
  );
}
