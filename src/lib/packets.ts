// ─── Metadata ────────────────────────────────────────────────────────────────

export interface QuestionMap {
  question_label: string;
  section: number;
  step: number;
  question_role: string;   // "standard" | "target_task" | "driving_question" | "target_task_primary" | "target_task_scaffold"
  question_type: string;   // "tdq-v-2" | "mpchoice" | "mpchoice-target-task" | etc.
  question: string;
}

export interface ActivityMetadata {
  objective: string;
  alignment_long: string;
  alignment_short: string;
  text_title: string;
  excerpt: string;         // full HTML of the text students read
  type: string;            // "literal_comp" | "closeread" | "language" | "multistep" | "writing"
  grade_level: number;
  curriculum_provider: string;
  unit_name: string;
  lesson_number: string;
  exit_ticket: string[];
  questions_map: QuestionMap[];
}

// ─── Class-level aggregates ───────────────────────────────────────────────────

export interface CompletionFunnel {
  students_enrolled: number;
  students_with_sessions: number;
  students_without_sessions: number;
  students_with_responses: number;
  students_reached_target_task: number;
  students_scored_on_target_task: number;
}

export interface QuestionBreakdown {
  question_label: string;
  section: number;
  step: number;
  question_text: string;
  question_role: string;
  student_count: number;
  pct_correct_first: number;
  pct_correct_after_scaffolding: number;
  pct_never_correct: number;
}

export interface FlaggedResponses {
  flagged_response_count: number;
  flagged_student_count: number;
}

export interface StudentOfConcern {
  student_id: string;
  concern_type: "no_responses" | "low_completion" | "never_correct_target" | "all_flagged";
  detail: string;
}

export interface Overrides {
  override_count: number;
  override_student_count: number;
}

export interface ActivityPacket {
  activity_metadata: ActivityMetadata;
  completion_funnel: CompletionFunnel;
  per_question_breakdown: QuestionBreakdown[];
  flagged_responses: FlaggedResponses;
  students_of_concern: StudentOfConcern[];
  overrides: Overrides;
}

// ─── Per-student transcript ───────────────────────────────────────────────────

export type BucketLabel =
  | "correct"
  | "partial-understanding"
  | "incorrect"
  | "limited-effort"
  | "Flagged"
  | "asking-questions"
  | "flagged-likely-not-original"
  | "flagged-inappropriate"
  | "score_0"
  | "score_1"
  | "score_2"
  | null;

export interface StudentResponse {
  attempt_num: number;
  content: string;
  bucket_label: BucketLabel;
  bucket_rationale: string | null;
  bucket_label_secondary: BucketLabel;
  bucket_rationale_secondary: string | null;
  point_value: number;
  points_possible: number;
}

export interface StudentQuestionEntry {
  question_label: string;
  question: string;
  section: number;
  step: number;
  responses: StudentResponse[];
}

// transcript_data is keyed by student ID (e.g. "USER_1")
export type TranscriptData = Record<string, StudentQuestionEntry[]>;

export interface PacketFile {
  activity_data_packet: ActivityPacket;
  transcript_data: TranscriptData;
}

// ─── Index ────────────────────────────────────────────────────────────────────

export type PacketIndex = Record<string, string[]>;

let indexCache: PacketIndex | null = null;

export async function getIndex(): Promise<PacketIndex> {
  if (indexCache) return indexCache;
  const res = await fetch(`${import.meta.env.BASE_URL}packets/index.json`);
  if (!res.ok) throw new Error("Could not load packet index");
  indexCache = await res.json();
  return indexCache!;
}

export function getShortCodes(): Promise<string[]> {
  return getIndex().then((idx) => Object.keys(idx).sort());
}

export async function getPacketIds(shortCode: string): Promise<string[]> {
  const idx = await getIndex();
  return idx[shortCode] ?? [];
}

export async function getFullPacket(shortCode: string, packetId: string): Promise<PacketFile> {
  const res = await fetch(`${import.meta.env.BASE_URL}packets/${shortCode}/${packetId}.json`);
  if (!res.ok) throw new Error(`Packet not found: ${shortCode}/${packetId}`);
  return res.json() as Promise<PacketFile>;
}

export async function getPacket(shortCode: string, packetId: string): Promise<ActivityPacket> {
  const file = await getFullPacket(shortCode, packetId);
  return file.activity_data_packet;
}

export async function getTranscript(shortCode: string, packetId: string): Promise<TranscriptData> {
  const file = await getFullPacket(shortCode, packetId);
  return file.transcript_data ?? {};
}

export async function getAllPacketsForShortCode(shortCode: string): Promise<ActivityPacket[]> {
  const ids = await getPacketIds(shortCode);
  return Promise.all(ids.map((id) => getPacket(shortCode, id)));
}

// ─── Derived helpers ──────────────────────────────────────────────────────────

/**
 * Returns the final (last-attempt) bucket label for a question entry.
 * Useful for computing whether a student ultimately got something correct.
 */
export function finalBucket(entry: StudentQuestionEntry): BucketLabel {
  const responses = entry.responses;
  if (!responses.length) return null;
  return responses[responses.length - 1].bucket_label;
}

export function isCorrect(label: BucketLabel): boolean {
  return label === "correct";
}

export function isEventuallyCorrect(entry: StudentQuestionEntry): boolean {
  return entry.responses.some((r) => r.bucket_label === "correct");
}

export function correctOnFirstAttempt(entry: StudentQuestionEntry): boolean {
  return entry.responses[0]?.bucket_label === "correct";
}

export function neededScaffolding(entry: StudentQuestionEntry): boolean {
  return isEventuallyCorrect(entry) && !correctOnFirstAttempt(entry);
}
