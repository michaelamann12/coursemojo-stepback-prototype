/**
 * Loads pre-aggregated class_timeline.json files for every classroom and
 * computes district-level rollups for the stepback deck.
 *
 * One class_timeline = one classroom × N activities (each with completion_funnel,
 * standards_assessed, top_blockers, teacher_actions). Loading 36 small files is
 * far cheaper than fetching 672 raw packets, and the timelines have everything
 * the narrative slides need.
 */

import { getShortCodes } from "@lib/packets";

export interface ClassTimelineEntry {
  activity_id: string;
  unit: string;
  lesson: string;
  text_title: string;
  activity_type: string;
  grade_level: number;
  completion_funnel: {
    students_enrolled: number;
    students_with_sessions: number;
    students_without_sessions: number;
    students_with_responses: number;
    students_reached_target_task: number;
    students_scored_on_target_task: number;
  };
  avg_pct_correct_first?: number;
  avg_pct_correct_scaffolding?: number;
  avg_pct_never_correct?: number;
  standards_assessed?: Record<string, number>;
  top_blockers?: { blocker: string; tier: number; count: number }[];
  teacher_actions?: unknown;
  questions_map?: { mojo_standard?: string }[];
  students_of_concern?: { student_id: string; concern_type: string }[];
}

export type ClassTimeline = ClassTimelineEntry[];

let timelinesCache: Map<string, ClassTimeline> | null = null;

export async function loadAllTimelines(): Promise<Map<string, ClassTimeline>> {
  if (timelinesCache) return timelinesCache;
  const codes = await getShortCodes();
  const entries: [string, ClassTimeline][] = await Promise.all(
    codes.map(async (code) => {
      const res = await fetch(`${import.meta.env.BASE_URL}derived/${code}/class_timeline.json`);
      if (!res.ok) return [code, []] as [string, ClassTimeline];
      return [code, (await res.json()) as ClassTimeline] as [string, ClassTimeline];
    })
  );
  timelinesCache = new Map(entries);
  return timelinesCache;
}

// ─── District-level rollups for slide 12 (Usage Narrative) ────────────────

export interface UsageRollup {
  classroomCount: number;
  totalActivities: number;
  avgActivitiesPerClass: number;

  // Approximate "unique students" — sum of max(students_enrolled) per class.
  approxStudents: number;

  // Engagement / completion across activities.
  activitiesWith60PctCompletion: number;
  pctActivitiesWith60PctCompletion: number;

  // Sessions → responses ratio (active engagement once a student starts).
  avgResponseRate: number;

  // Target-task funnel.
  studentsReachedTargetTask: number;
  studentsScoredOnTargetTask: number;
  pctScoredAmongReached: number;

  // Standards covered across the district.
  standardsCovered: { standard: string; questionCount: number }[];
}

// ─── Per-class summary (for slide 13 — Usage detail) ─────────────────────

export interface ClassSummary {
  shortCode: string;
  activityCount: number;
  roster: number;
  avgResponseRate: number;     // responses / sessions, per activity, averaged
  pctReachedTarget: number;    // students_reached / students_with_sessions, weighted
  pctScoredTarget: number;     // scored / reached, weighted
  pctActivitiesAt60: number;
  flagBadge?: "strong" | "soft" | "concern";
}

export function summarizeClasses(
  timelines: Map<string, ClassTimeline>
): ClassSummary[] {
  const out: ClassSummary[] = [];
  for (const [shortCode, entries] of timelines) {
    if (entries.length === 0) continue;
    let roster = 0;
    let respRateSum = 0;
    let respRateN = 0;
    let totalSessions = 0;
    let totalReached = 0;
    let totalScored = 0;
    let act60 = 0;
    for (const e of entries) {
      const f = e.completion_funnel;
      roster = Math.max(roster, f.students_enrolled ?? 0);
      const enrolled = f.students_enrolled ?? 0;
      const responded = f.students_with_responses ?? 0;
      const sessions = f.students_with_sessions ?? 0;
      if (enrolled > 0 && responded / enrolled >= 0.6) act60 += 1;
      if (sessions > 0) {
        respRateSum += responded / sessions;
        respRateN += 1;
      }
      totalSessions += sessions;
      totalReached += f.students_reached_target_task ?? 0;
      totalScored += f.students_scored_on_target_task ?? 0;
    }
    const avgResp = respRateN > 0 ? respRateSum / respRateN : 0;
    const pctReached = totalSessions > 0 ? totalReached / totalSessions : 0;
    const pctScored = totalReached > 0 ? totalScored / totalReached : 0;
    const pctAct60 = entries.length > 0 ? act60 / entries.length : 0;
    let flagBadge: ClassSummary["flagBadge"];
    if (pctAct60 >= 0.8 && pctScored >= 0.8) flagBadge = "strong";
    else if (pctAct60 < 0.4 || pctScored < 0.5) flagBadge = "concern";
    else flagBadge = "soft";
    out.push({
      shortCode,
      activityCount: entries.length,
      roster,
      avgResponseRate: avgResp,
      pctReachedTarget: pctReached,
      pctScoredTarget: pctScored,
      pctActivitiesAt60: pctAct60,
      flagBadge,
    });
  }
  out.sort((a, b) => b.pctScoredTarget - a.pctScoredTarget);
  return out;
}

// ─── Implementation rollup (slides 16 + 17) ──────────────────────────────

export interface TeacherActions {
  app_usage?: {
    fast_forward?: { used?: boolean };
    add_time?: { used?: boolean; times_used?: number };
    pause?: { used?: boolean; pause_count?: number };
    viewed_transcripts?: { used?: boolean; student_ids?: string[] };
  };
  tool_usage?: {
    misconception_tool?: { used?: boolean };
    celebrations_tool?: { used?: boolean };
    conferences_tool?: { used?: boolean; student_groups?: unknown[] };
    post_activity_summary?: { used?: boolean };
  };
}

export interface FeatureUsage {
  key: string;
  label: string;
  category: "tool" | "app";
  activitiesUsed: number;
  pctActivitiesUsed: number;
}

export interface ImplementationRollup {
  totalActivities: number;
  features: FeatureUsage[];
}

const TOOL_FEATURES: { key: string; label: string }[] = [
  { key: "post_activity_summary", label: "Post-activity summary" },
  { key: "misconception_tool", label: "Misconception tool" },
  { key: "celebrations_tool", label: "Celebrations tool" },
  { key: "conferences_tool", label: "Conferences tool" },
];
const APP_FEATURES: { key: string; label: string }[] = [
  { key: "viewed_transcripts", label: "Viewed transcripts" },
  { key: "fast_forward", label: "Fast forward" },
  { key: "pause", label: "Pause" },
  { key: "add_time", label: "Added time" },
];

export function computeImplementationRollup(
  timelines: Map<string, ClassTimeline>
): ImplementationRollup {
  const counts = new Map<string, number>();
  let total = 0;
  for (const [, entries] of timelines) {
    for (const e of entries) {
      total += 1;
      const ta = (e.teacher_actions ?? {}) as TeacherActions;
      for (const f of TOOL_FEATURES) {
        const used = (ta.tool_usage as Record<string, { used?: boolean } | undefined> | undefined)?.[f.key]?.used;
        if (used) counts.set(`tool:${f.key}`, (counts.get(`tool:${f.key}`) ?? 0) + 1);
      }
      for (const f of APP_FEATURES) {
        const used = (ta.app_usage as Record<string, { used?: boolean } | undefined> | undefined)?.[f.key]?.used;
        if (used) counts.set(`app:${f.key}`, (counts.get(`app:${f.key}`) ?? 0) + 1);
      }
    }
  }
  const features: FeatureUsage[] = [
    ...TOOL_FEATURES.map((f) => ({
      key: f.key,
      label: f.label,
      category: "tool" as const,
      activitiesUsed: counts.get(`tool:${f.key}`) ?? 0,
      pctActivitiesUsed: total > 0 ? (counts.get(`tool:${f.key}`) ?? 0) / total : 0,
    })),
    ...APP_FEATURES.map((f) => ({
      key: f.key,
      label: f.label,
      category: "app" as const,
      activitiesUsed: counts.get(`app:${f.key}`) ?? 0,
      pctActivitiesUsed: total > 0 ? (counts.get(`app:${f.key}`) ?? 0) / total : 0,
    })),
  ];
  return { totalActivities: total, features };
}

// ─── Performance rollup (slide 18) ───────────────────────────────────────

export interface PerformanceRollup {
  totalActivities: number;
  activitiesWithMetrics: number;
  // Weighted by question count where possible; here we average per-activity
  // averages — close enough for narrative slides since activity question counts
  // don't vary wildly.
  avgPctCorrectFirst: number;
  avgPctCorrectAfterScaffolding: number;
  avgPctNeverCorrect: number;
  topBlockers: { blocker: string; tier: number; count: number }[];
  standards: { standard: string; questionCount: number }[];
}

const BLOCKER_TIER_LABEL: Record<number, string> = {
  1: "Access",
  2: "Foundational",
  3: "Analyze",
  4: "Communicate",
};
export function blockerTierLabel(tier: number): string {
  return BLOCKER_TIER_LABEL[tier] ?? "—";
}

export function computePerformanceRollup(
  timelines: Map<string, ClassTimeline>
): PerformanceRollup {
  let total = 0;
  let withMetrics = 0;
  let firstSum = 0;
  let scafSum = 0;
  let neverSum = 0;
  const blockerCounts = new Map<string, { tier: number; count: number }>();
  const stdCounts = new Map<string, number>();

  for (const [, entries] of timelines) {
    for (const e of entries) {
      total += 1;
      if (
        typeof e.avg_pct_correct_first === "number" &&
        typeof e.avg_pct_correct_scaffolding === "number" &&
        typeof e.avg_pct_never_correct === "number"
      ) {
        firstSum += e.avg_pct_correct_first;
        scafSum += e.avg_pct_correct_scaffolding;
        neverSum += e.avg_pct_never_correct;
        withMetrics += 1;
      }
      for (const b of e.top_blockers ?? []) {
        const cur = blockerCounts.get(b.blocker) ?? { tier: b.tier, count: 0 };
        cur.count += b.count;
        blockerCounts.set(b.blocker, cur);
      }
      for (const [std, n] of Object.entries(e.standards_assessed ?? {})) {
        stdCounts.set(std, (stdCounts.get(std) ?? 0) + (n as number));
      }
    }
  }

  return {
    totalActivities: total,
    activitiesWithMetrics: withMetrics,
    avgPctCorrectFirst: withMetrics > 0 ? firstSum / withMetrics : 0,
    avgPctCorrectAfterScaffolding: withMetrics > 0 ? scafSum / withMetrics : 0,
    avgPctNeverCorrect: withMetrics > 0 ? neverSum / withMetrics : 0,
    topBlockers: [...blockerCounts.entries()]
      .map(([blocker, v]) => ({ blocker, tier: v.tier, count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6),
    standards: [...stdCounts.entries()]
      .map(([standard, questionCount]) => ({ standard, questionCount }))
      .sort((a, b) => b.questionCount - a.questionCount),
  };
}

// ─── Growth rollup (slides 14 + 15) ──────────────────────────────────────

export interface GrowthBucket {
  label: string;             // "Early in unit" / "Mid-year" / "Recent"
  activities: number;
  avgPctCorrectFirst: number;
  avgPctCorrectAfterScaffolding: number;
  avgPctNeverCorrect: number;
}

export interface GrowthRollup {
  buckets: GrowthBucket[];
  // Convenience deltas computed against the earliest bucket.
  liftFirstTry: number;            // late - early, in pct points
  liftMastery: number;             // (late.first + late.scaff) - (early.first + early.scaff)
}

/**
 * Splits each class's chronologically-ordered timeline into thirds, then
 * aggregates first-try / scaffolded / never-correct rates per third across
 * the whole district. The class timeline is already sorted by curriculum
 * order (unit + lesson), so position = time proxy.
 */
export function computeGrowthRollup(
  timelines: Map<string, ClassTimeline>
): GrowthRollup {
  const labels = ["Early in year", "Mid-year", "Recent activities"];
  const sums = labels.map(() => ({ first: 0, scaf: 0, never: 0, n: 0, acts: 0 }));

  for (const [, entries] of timelines) {
    const total = entries.length;
    if (total === 0) continue;
    entries.forEach((e, idx) => {
      const a = e.avg_pct_correct_first;
      const b = e.avg_pct_correct_scaffolding;
      const c = e.avg_pct_never_correct;
      // Bucket index: 0/1/2 based on position
      let bi: number;
      if (idx < total / 3) bi = 0;
      else if (idx < (2 * total) / 3) bi = 1;
      else bi = 2;
      sums[bi].acts += 1;
      if (typeof a === "number" && typeof b === "number" && typeof c === "number") {
        sums[bi].first += a;
        sums[bi].scaf += b;
        sums[bi].never += c;
        sums[bi].n += 1;
      }
    });
  }

  const buckets: GrowthBucket[] = sums.map((s, i) => ({
    label: labels[i],
    activities: s.acts,
    avgPctCorrectFirst: s.n > 0 ? s.first / s.n : 0,
    avgPctCorrectAfterScaffolding: s.n > 0 ? s.scaf / s.n : 0,
    avgPctNeverCorrect: s.n > 0 ? s.never / s.n : 0,
  }));

  const early = buckets[0];
  const late = buckets[buckets.length - 1];
  return {
    buckets,
    liftFirstTry: late.avgPctCorrectFirst - early.avgPctCorrectFirst,
    liftMastery:
      (late.avgPctCorrectFirst + late.avgPctCorrectAfterScaffolding) -
      (early.avgPctCorrectFirst + early.avgPctCorrectAfterScaffolding),
  };
}

// ─── Connector / partnership stats (slide 2) ─────────────────────────────

export interface PartnershipStats {
  classroomCount: number;
  totalActivities: number;
  approxStudents: number;
  monthsPartnered: number; // hard-coded for the prototype
  schoolCount: number;     // estimate from classroom buckets
}

export function computePartnershipStats(
  timelines: Map<string, ClassTimeline>
): PartnershipStats {
  let total = 0;
  let students = 0;
  for (const [, entries] of timelines) {
    total += entries.length;
    let max = 0;
    for (const e of entries) max = Math.max(max, e.completion_funnel.students_enrolled ?? 0);
    students += max;
  }
  // ~10 classrooms per school is a reasonable district shape
  return {
    classroomCount: timelines.size,
    totalActivities: total,
    approxStudents: students,
    monthsPartnered: 18,
    schoolCount: Math.max(1, Math.round(timelines.size / 12)),
  };
}

export function computeUsageRollup(
  timelines: Map<string, ClassTimeline>
): UsageRollup {
  let totalActivities = 0;
  let approxStudents = 0;
  let activitiesWith60 = 0;
  let responseRateSum = 0;
  let responseRateN = 0;
  let reachedTarget = 0;
  let scoredTarget = 0;
  const standardCounts = new Map<string, number>();

  for (const [, entries] of timelines) {
    let maxRoster = 0;
    for (const e of entries) {
      totalActivities += 1;
      const f = e.completion_funnel;
      maxRoster = Math.max(maxRoster, f.students_enrolled ?? 0);

      // ≥60% completion threshold: students_with_responses / students_enrolled
      const enrolled = f.students_enrolled ?? 0;
      const responded = f.students_with_responses ?? 0;
      if (enrolled > 0 && responded / enrolled >= 0.6) activitiesWith60 += 1;

      // Active engagement: of students who *started*, what % responded
      const started = f.students_with_sessions ?? 0;
      if (started > 0) {
        responseRateSum += responded / started;
        responseRateN += 1;
      }

      reachedTarget += f.students_reached_target_task ?? 0;
      scoredTarget += f.students_scored_on_target_task ?? 0;

      // Standards covered — sum question counts per MOJO standard
      for (const [std, n] of Object.entries(e.standards_assessed ?? {})) {
        standardCounts.set(std, (standardCounts.get(std) ?? 0) + (n as number));
      }
    }
    approxStudents += maxRoster;
  }

  const classroomCount = timelines.size;
  return {
    classroomCount,
    totalActivities,
    avgActivitiesPerClass: classroomCount > 0 ? totalActivities / classroomCount : 0,
    approxStudents,
    activitiesWith60PctCompletion: activitiesWith60,
    pctActivitiesWith60PctCompletion:
      totalActivities > 0 ? activitiesWith60 / totalActivities : 0,
    avgResponseRate: responseRateN > 0 ? responseRateSum / responseRateN : 0,
    studentsReachedTargetTask: reachedTarget,
    studentsScoredOnTargetTask: scoredTarget,
    pctScoredAmongReached: reachedTarget > 0 ? scoredTarget / reachedTarget : 0,
    standardsCovered: [...standardCounts.entries()]
      .map(([standard, questionCount]) => ({ standard, questionCount }))
      .sort((a, b) => b.questionCount - a.questionCount),
  };
}
