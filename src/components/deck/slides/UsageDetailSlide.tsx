import { useEffect, useState } from "preact/hooks";
import { Slide } from "../Slide.tsx";
import {
  loadAllTimelines,
  summarizeClasses,
  type ClassSummary,
} from "@lib/deckData.ts";

const fmtPct = (n: number) => `${Math.round(n * 100)}%`;

/**
 * Slide 13 — Usage detail.
 * Per-classroom breakdown that underwrites slide 12's headlines.
 */
export function UsageDetailSlide() {
  const [rows, setRows] = useState<ClassSummary[] | null>(null);
  useEffect(() => {
    loadAllTimelines().then((tl) => setRows(summarizeClasses(tl)));
  }, []);

  return (
    <Slide
      eyebrow="Data Review · Usage"
      title="Usage by classroom"
      lead="36 classrooms, sorted by target-task scoring rate. The top of the list is the model — the bottom needs support."
    >
      {!rows ? (
        <div class="deck-loading">Loading…</div>
      ) : (
        <div class="usage-detail-wrap">
          <table class="usage-detail-table">
            <thead>
              <tr>
                <th>Classroom</th>
                <th>Roster</th>
                <th>Activities</th>
                <th>Avg engagement</th>
                <th>Target reach</th>
                <th>Target score</th>
                <th class="usage-detail-flag-col">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.shortCode}>
                  <td><span class="classcode">{r.shortCode}</span></td>
                  <td>{r.roster}</td>
                  <td>{r.activityCount}</td>
                  <td><Bar value={r.avgResponseRate} /></td>
                  <td><Bar value={r.pctReachedTarget} /></td>
                  <td><Bar value={r.pctScoredTarget} accent /></td>
                  <td>
                    {r.flagBadge === "strong" ? <span class="badge badge--strong">Strong</span> : null}
                    {r.flagBadge === "soft" ? <span class="badge badge--soft">On track</span> : null}
                    {r.flagBadge === "concern" ? <span class="badge badge--concern">Needs support</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Slide>
  );
}

function Bar({ value, accent }: { value: number; accent?: boolean }) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div class={accent ? "minibar minibar--accent" : "minibar"}>
      <div class="minibar-track">
        <div class="minibar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span class="minibar-label">{fmtPct(value)}</span>
    </div>
  );
}
