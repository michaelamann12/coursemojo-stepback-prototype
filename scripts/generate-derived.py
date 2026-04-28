"""
Enriches packet data and generates derived files.

Pass 1 — modifies public/packets/ in place:
  - Adds `mojo_standard` to each question in activity_metadata.questions_map
  - Replaces `bucket_label_secondary` with `canonical_blocker` in transcript_data responses

Pass 2 — generates public/derived/{SC}/:
  - class_timeline.json   all activities ordered by unit/lesson with class-level metrics over time
  - students/{ID}.json    per-student timeline across all activities in the class

Usage:
    python scripts/generate-derived.py

Run from the project root.
"""

import json
import os
import re
import glob
import random
from collections import defaultdict

PACKETS_DIR = os.path.join(os.path.dirname(__file__), "../public/packets")
DERIVED_DIR = os.path.join(os.path.dirname(__file__), "../public/derived")

# ─── Blocker mapping ──────────────────────────────────────────────────────────
#
# Waterfall tiers:
#   1 (Access):       task | vocabulary | syntax | background-knowledge
#   2 (Foundational): comprehend-text
#   3 (Analyze):      cite-evidence | analyze-character | analyze-craft |
#                     analyze-theme | compare-contrast | analyze-argument | synthesize
#   4 (Communicate):  focus | evidence | development | organization

BLOCKER_TIER = {
    "task": 1, "vocabulary": 1, "syntax": 1, "background-knowledge": 1,
    "comprehend-text": 2,
    "cite-evidence": 3, "analyze-character": 3, "analyze-craft": 3,
    "analyze-theme": 3, "compare-contrast": 3, "analyze-argument": 3, "synthesize": 3,
    "focus": 4, "evidence": 4, "development": 4, "organization": 4,
}

EXACT_BLOCKER = {
    "vague_or_unclear": "task", "unrelated_or_vague": "task", "unrelated_or_minimal": "task",
    "primary_unanswered": "task", "generic_response": "task", "too_brief": "task",
    "off_topic": "task", "fallback": "task", "wrong_focus": "task", "fused_unclear": "task",
    "multiple_issues": "task", "minimal_effort": "task", "copy_paste": "task",
    "contradiction": "task", "personal_example_only": "task", "wrong_paragraph_reference": "task",
    "secondary_part_skipped": "task", "secondary_skipped_word_choice": "task",
    "generic_no_text_connection": "task",
    "label_without_connection": "development", "needs_more_ideas": "development",
    "multiple_examples_no_connection": "development",
    "single_evidence": "evidence", "evidence_only": "evidence",
    "multiple_insufficient": "evidence", "single_text_only": "evidence", "vague_evidence": "evidence",
    "sentence_clarity_pronoun": "organization", "lists_without_connecting": "organization",
    "word_choice_only": "organization", "wrong_structure_with_reasoning": "organization",
    "writing_mechanics_fragment": "organization", "writing_mechanics_multiple_sentences": "organization",
    "writing_mechanics_question": "organization", "writing_mechanics_unparseable": "organization",
    "circular_reasoning": "analyze-character", "mentions_without_analyzing": "analyze-character",
    "has_encouragement_missing_motto": "analyze-character", "incomplete_motto": "analyze-character",
    "substance_wrong_direction": "comprehend-text", "substance_reverses_central_idea": "comprehend-text",
    "substance_factually_wrong": "comprehend-text",
    "background_knowledge_historical": "background-knowledge",
    "fabricated_motto": "task", "confuses_advice_with_motto": "vocabulary",
    "borderline_brief_but_correct": "development", "borderline_brief_but_accurate": "development",
    "borderline_accurate_but_brief": "development", "borderline_brief_but_correct_direction": "development",
    "borderline_parent_implied": "development", "borderline_has_students_brief_response": "development",
}

PREFIX_BLOCKER = [
    ("inference_",            "analyze-character"),
    ("task_alignment_",       "task"),
    ("word_level_",           "vocabulary"),
    ("claim_formation_",      "focus"),
    ("claim_",                "focus"),
    ("reasoning_",            "analyze-character"),
    ("central_idea_",         "analyze-theme"),
    ("evidence_explanation_", "development"),
    ("evidence_selection_",   "evidence"),
    ("evidence_",             "evidence"),
    ("authors_craft_",        "analyze-craft"),
    ("text_structure_",       "analyze-craft"),
    ("theme_interpretation_", "analyze-theme"),
    ("writing_mechanics_",    "organization"),
    ("borderline_",           "development"),
    ("substance_",            "comprehend-text"),
]

def to_canonical_blocker(label):
    if not label:
        return None
    b = EXACT_BLOCKER.get(label)
    if b:
        return b
    for prefix, blocker in PREFIX_BLOCKER:
        if label.startswith(prefix):
            return blocker
    return None

# ─── Standard inference ───────────────────────────────────────────────────────

def infer_standard(question_text, question_type, question_role):
    qt = (question_type or "").lower()
    qr = (question_role or "").lower()
    q  = (question_text or "").lower()

    if "target_task" in qr or qr == "target_task":
        if any(t in qt for t in ["quickwrite", "shortwrite", "short-write", "write", "claim", "narrative"]):
            return "MOJO.WRITE-ARGUMENT"
        return "MOJO.SYNTHESIZE"

    if "highlight" in qt:
        return "MOJO.CITE-EVIDENCE"

    if any(p in q for p in ["what does the word", "what does the phrase", "meaning of the word",
                              "as used in paragraph", "as it is used", "define"]):
        return "MOJO.CITE-EVIDENCE"

    if any(p in q for p in ["highlight the evidence", "cite evidence", "quote from",
                              "according to the text", "from the text", "text evidence"]):
        return "MOJO.CITE-EVIDENCE"

    if any(p in q for p in ["theme", "central idea", "main idea", "main message",
                              "overall message", "lesson of"]):
        return "MOJO.ANALYZE-THEME"

    if any(p in q for p in ["author use", "author's use", "word choice", "figurative",
                              "metaphor", "simile", "structure", "how does the author",
                              "why does the author", "tone", "point of view", "narrator",
                              "author's craft"]):
        return "MOJO.ANALYZE-CRAFT"

    if any(p in q for p in ["compare", "contrast", "similar", "different", "alike",
                              "unlike", "both texts", "both authors"]):
        return "MOJO.COMPARE-CONTRAST"

    if any(p in q for p in ["argument", "claim", "reason", "evidence supports",
                              "agree or disagree", "support the argument"]):
        return "MOJO.ANALYZE-ARGUMENT"

    if any(p in q for p in ["feel", "feeling", "emotion", "think", "why does", "how does",
                              "what does this tell", "what can you infer", "what might",
                              "motivation", "character", "relationship", "trait", "describe",
                              "explain why", "explain how", "what challenges"]):
        return "MOJO.ANALYZE-CHARACTER"

    return "MOJO.ANALYZE-CHARACTER"

# ─── Helpers ──────────────────────────────────────────────────────────────────

def sort_key(meta):
    try:
        unit   = int(re.sub(r"[^0-9]", "", str(meta.get("unit_name",   0) or 0)) or 0)
        lesson = int(re.sub(r"[^0-9]", "", str(meta.get("lesson_number", 0) or 0)) or 0)
    except Exception:
        unit, lesson = 0, 0
    return (unit, lesson)

def write_json(path, data):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, separators=(",", ":"))

# ─── Teacher action generation ───────────────────────────────────────────────

TIER_3_4_BLOCKERS = {
    "cite-evidence", "analyze-character", "analyze-craft", "analyze-theme",
    "compare-contrast", "analyze-argument", "synthesize",
    "focus", "evidence", "development", "organization",
}

def generate_teacher_actions(adp, td, activity_id):
    """
    Derive plausible teacher actions from class data.
    Uses activity_id as a deterministic seed so output is stable across runs.
    """
    rng = random.Random(activity_id)

    funnel  = adp.get("completion_funnel", {})
    pqb     = adp.get("per_question_breakdown", [])
    soc     = adp.get("students_of_concern", [])

    enrolled       = funnel.get("students_enrolled", 0) or 1
    with_sessions  = funnel.get("students_with_sessions", 0) or 0
    reached_target = funnel.get("students_reached_target_task", 0) or 0

    pct_reached = reached_target / max(with_sessions, 1)

    q_with_data = [q for q in pqb if q.get("student_count", 0) > 0]
    avg_never   = sum(q["pct_never_correct"] for q in q_with_data) / len(q_with_data) if q_with_data else 0
    avg_correct = sum(q["pct_correct_first"] for q in q_with_data) / len(q_with_data) if q_with_data else 0

    # Blocker counts from transcript
    blocker_counts = defaultdict(int)
    for entries in td.values():
        for entry in entries:
            for r in entry.get("responses", []):
                b = r.get("canonical_blocker")
                if b:
                    blocker_counts[b] += 1
    has_deep_blockers = any(b in TIER_3_4_BLOCKERS for b in blocker_counts)
    total_blockers    = sum(blocker_counts.values())

    concern_ids = [s["student_id"] for s in soc]

    # ── App usage ──────────────────────────────────────────────────────────────

    # fast_forward: teacher pushed class to target task when most were through std questions
    # More likely when high % reached target AND class was moving quickly
    fast_forward_prob = 0.2
    if pct_reached >= 0.7:
        fast_forward_prob = 0.75
    elif pct_reached >= 0.5:
        fast_forward_prob = 0.45
    used_fast_forward = rng.random() < fast_forward_prob

    # add_time: teacher extended time when class was struggling to progress
    add_time_prob = 0.15
    if pct_reached < 0.3:
        add_time_prob = 0.70
    elif pct_reached < 0.5:
        add_time_prob = 0.45
    used_add_time = rng.random() < add_time_prob
    add_time_count = rng.randint(1, 3) if used_add_time else 0

    # pause: teacher stopped the class — likely when many students were stuck
    pause_prob = 0.15
    if avg_never > 60:
        pause_prob = 0.70
    elif avg_never > 40:
        pause_prob = 0.45
    used_pause = rng.random() < pause_prob
    pause_count = rng.randint(1, 2) if used_pause else 0

    # viewed_transcripts: teacher checked student work — tied to students of concern
    viewed_ids = []
    if concern_ids:
        # Always view some; more likely to view all when concern count is small
        n_to_view = max(1, rng.randint(len(concern_ids) // 2, len(concern_ids)))
        viewed_ids = rng.sample(concern_ids, min(n_to_view, len(concern_ids)))
    # Small chance of checking high-performing students too
    all_student_ids = list(td.keys())
    non_concern = [s for s in all_student_ids if s not in concern_ids]
    if non_concern and rng.random() < 0.25:
        viewed_ids += rng.sample(non_concern, min(2, len(non_concern)))
    used_viewed = bool(viewed_ids)

    # ── Tool usage ─────────────────────────────────────────────────────────────

    # misconception_tool: surfaces top blockers — useful when there are real blockers
    misconception_prob = 0.20
    if total_blockers > 10 and has_deep_blockers:
        misconception_prob = 0.75
    elif total_blockers > 5:
        misconception_prob = 0.50
    elif avg_never > 40:
        misconception_prob = 0.45
    used_misconception = rng.random() < misconception_prob

    # celebrations_tool: surface strong responses — useful when performance is decent
    celebrations_prob = 0.15
    if avg_correct > 60:
        celebrations_prob = 0.70
    elif avg_correct > 40:
        celebrations_prob = 0.45
    elif pct_reached > 0.6:
        celebrations_prob = 0.35
    used_celebrations = rng.random() < celebrations_prob

    # conferences_tool: recommend student groupings — when enough concerns to group
    conferences_prob = 0.10
    if len(concern_ids) >= 5:
        conferences_prob = 0.65
    elif len(concern_ids) >= 3:
        conferences_prob = 0.40
    used_conferences = rng.random() < conferences_prob

    # Build groups from concern students (pairs/triples by concern type)
    conference_groups = []
    if used_conferences and len(concern_ids) >= 2:
        by_type = defaultdict(list)
        for s in soc:
            by_type[s["concern_type"]].append(s["student_id"])
        for concern_type, ids in by_type.items():
            rng.shuffle(ids)
            for i in range(0, len(ids), 2):
                group = ids[i:i+2]
                if len(group) >= 2:
                    conference_groups.append({"concern_type": concern_type, "student_ids": group})

    # post_activity_summary: general awareness tool — baseline always somewhat likely
    summary_prob = 0.40
    if avg_never > 50 or len(soc) > 4:
        summary_prob = 0.75
    used_summary = rng.random() < summary_prob

    return {
        "app_usage": {
            "fast_forward":       {"used": used_fast_forward},
            "add_time":           {"used": used_add_time, "times_used": add_time_count},
            "pause":              {"used": used_pause, "pause_count": pause_count},
            "viewed_transcripts": {"used": used_viewed, "student_ids": viewed_ids},
        },
        "tool_usage": {
            "misconception_tool":    {"used": used_misconception},
            "celebrations_tool":     {"used": used_celebrations},
            "conferences_tool":      {"used": used_conferences, "student_groups": conference_groups},
            "post_activity_summary": {"used": used_summary},
        },
    }


# ─── Pass 1: enrich + rewrite original packets ────────────────────────────────

def enrich_packet(fpath):
    activity_id = os.path.basename(fpath).replace(".json", "")

    with open(fpath) as f:
        raw = json.load(f)

    adp = raw.get("activity_data_packet", {})
    td  = raw.get("transcript_data", {})

    # Enrich questions_map with mojo_standard
    meta = adp.get("activity_metadata", {})
    for q in meta.get("questions_map", []):
        q["mojo_standard"] = infer_standard(
            q.get("question", ""),
            q.get("question_type", ""),
            q.get("question_role", ""),
        )

    # Replace bucket_label_secondary with canonical_blocker in transcript
    for student_id, entries in td.items():
        for entry in entries:
            for r in entry.get("responses", []):
                secondary = r.pop("bucket_label_secondary", None)
                r.pop("bucket_rationale_secondary", None)
                r["canonical_blocker"] = to_canonical_blocker(secondary)

    # Generate teacher actions
    adp["teacher_actions"] = generate_teacher_actions(adp, td, activity_id)

    with open(fpath, "w") as f:
        json.dump(raw, f, separators=(",", ":"))

# ─── Pass 2: derived files ────────────────────────────────────────────────────

def build_derived(sc, packet_files):
    activities = []

    for fpath in packet_files:
        activity_id = os.path.basename(fpath).replace(".json", "")
        raw = json.load(open(fpath))

        adp    = raw.get("activity_data_packet", {})
        td     = raw.get("transcript_data", {})
        meta   = adp.get("activity_metadata", {})
        funnel = adp.get("completion_funnel", {})
        pqb    = adp.get("per_question_breakdown", [])
        soc    = adp.get("students_of_concern", [])

        concern_by_student = {s["student_id"]: s["concern_type"] for s in soc}

        # Per-student data for this activity
        student_snapshots = {}
        for student_id, entries in td.items():
            questions = []
            for entry in entries:
                responses = entry.get("responses", [])
                correct_first      = responses[0]["bucket_label"] == "correct" if responses else False
                eventually_correct = any(r["bucket_label"] == "correct" for r in responses)
                final_bucket       = responses[-1]["bucket_label"] if responses else None

                questions.append({
                    "question_label":      entry.get("question_label"),
                    "question":            entry.get("question"),
                    "section":             entry.get("section"),
                    "step":                entry.get("step"),
                    "mojo_standard":       infer_standard(
                        entry.get("question", ""),
                        "",
                        "target_task" if (entry.get("section") or 0) == 1 else "standard",
                    ),
                    "correct_first":       correct_first,
                    "eventually_correct":  eventually_correct,
                    "needed_scaffolding":  eventually_correct and not correct_first,
                    "never_correct":       not eventually_correct and bool(responses),
                    "final_bucket":        final_bucket,
                    "attempt_count":       len(responses),
                    "responses":           responses,
                })

            answered = [q for q in questions if q["attempt_count"] > 0]
            target_qs = [q for q in answered if (q["section"] or 0) == 1]

            blocker_counts = defaultdict(int)
            for q in answered:
                for r in q["responses"]:
                    b = r.get("canonical_blocker")
                    if b:
                        blocker_counts[b] += 1

            student_snapshots[student_id] = {
                "concern_type": concern_by_student.get(student_id),
                "summary": {
                    "questions_attempted":    len(answered),
                    "reached_target_task":    any((q["section"] or 0) == 1 for q in answered),
                    "pct_correct_first":      round(100 * sum(q["correct_first"] for q in answered) / len(answered), 1) if answered else 0,
                    "pct_needed_scaffolding": round(100 * sum(q["needed_scaffolding"] for q in answered) / len(answered), 1) if answered else 0,
                    "pct_never_correct":      round(100 * sum(q["never_correct"] for q in answered) / len(answered), 1) if answered else 0,
                    "target_task_correct":    sum(q["eventually_correct"] for q in target_qs) if target_qs else None,
                    "target_task_count":      len(target_qs) if target_qs else None,
                    "blocker_counts":         dict(sorted(blocker_counts.items(), key=lambda x: -x[1])),
                },
                "questions": questions,
            }

        activities.append({
            "activity_id":   activity_id,
            "unit":          meta.get("unit_name"),
            "lesson":        meta.get("lesson_number"),
            "text_title":    meta.get("text_title"),
            "activity_type": meta.get("type"),
            "grade_level":   meta.get("grade_level"),
            "questions_map": meta.get("questions_map", []),
            "completion_funnel":       funnel,
            "per_question_breakdown":  pqb,
            "students_of_concern":     soc,
            "teacher_actions":         adp.get("teacher_actions", {}),
            "student_snapshots":       student_snapshots,
            "_sort_key":               sort_key(meta),
        })

    activities.sort(key=lambda a: a["_sort_key"])
    for a in activities:
        del a["_sort_key"]

    return activities


def build_class_timeline(activities):
    timeline = []
    for a in activities:
        pqb = a["per_question_breakdown"]
        q_data = [q for q in pqb if q.get("student_count", 0) > 0]

        def avg(field):
            return round(sum(q[field] for q in q_data) / len(q_data), 1) if q_data else None

        # Aggregate blocker counts across all students in this activity
        all_blockers = defaultdict(int)
        for sd in a["student_snapshots"].values():
            for blocker, cnt in sd["summary"]["blocker_counts"].items():
                all_blockers[blocker] += cnt

        top_blockers = [
            {"blocker": b, "count": c, "tier": BLOCKER_TIER.get(b)}
            for b, c in sorted(all_blockers.items(), key=lambda x: -x[1])[:5]
        ]

        # Standard breakdown: how many questions per standard
        standard_counts = defaultdict(int)
        for q in a["questions_map"]:
            standard_counts[q.get("mojo_standard", "unknown")] += 1

        timeline.append({
            "activity_id":   a["activity_id"],
            "unit":          a["unit"],
            "lesson":        a["lesson"],
            "text_title":    a["text_title"],
            "activity_type": a["activity_type"],
            "grade_level":   a["grade_level"],
            "questions_map": a["questions_map"],
            "completion_funnel": a["completion_funnel"],
            "avg_pct_correct_first":       avg("pct_correct_first"),
            "avg_pct_correct_scaffolding": avg("pct_correct_after_scaffolding"),
            "avg_pct_never_correct":       avg("pct_never_correct"),
            "top_blockers":                top_blockers,
            "standards_assessed":          dict(standard_counts),
            "students_of_concern":         a["students_of_concern"],
            "teacher_actions":             a["teacher_actions"],
        })
    return timeline


def build_student_files(sc, activities):
    all_students = set()
    for a in activities:
        all_students.update(a["student_snapshots"].keys())

    students = {}
    for student_id in all_students:
        activity_rows = []
        all_concern_types = set()
        all_blockers = defaultdict(int)

        for a in activities:
            snap = a["student_snapshots"].get(student_id)
            if snap is None:
                continue
            if snap.get("concern_type"):
                all_concern_types.add(snap["concern_type"])
            for b, c in snap["summary"]["blocker_counts"].items():
                all_blockers[b] += c

            activity_rows.append({
                "activity_id":   a["activity_id"],
                "unit":          a["unit"],
                "lesson":        a["lesson"],
                "text_title":    a["text_title"],
                "activity_type": a["activity_type"],
                "concern_type":  snap["concern_type"],
                "summary":       snap["summary"],
                "questions":     snap["questions"],
            })

        students[student_id] = {
            "student_id":    student_id,
            "short_code":    sc,
            "concern_flags": sorted(all_concern_types),
            "top_blockers":  [
                {"blocker": b, "count": c, "tier": BLOCKER_TIER.get(b)}
                for b, c in sorted(all_blockers.items(), key=lambda x: -x[1])[:5]
            ],
            "activities": activity_rows,
        }

    return students

# ─── Main ─────────────────────────────────────────────────────────────────────

def main():
    index = json.load(open(os.path.join(PACKETS_DIR, "index.json")))

    for sc, packet_ids in sorted(index.items()):
        packet_files = [
            os.path.join(PACKETS_DIR, sc, f"{pid}.json")
            for pid in packet_ids
            if os.path.exists(os.path.join(PACKETS_DIR, sc, f"{pid}.json"))
        ]

        print(f"Processing {sc} ({len(packet_files)} activities)…")

        # Pass 1: enrich packets in place
        for fpath in packet_files:
            enrich_packet(fpath)

        # Pass 2: build derived files
        activities = build_derived(sc, packet_files)

        timeline = build_class_timeline(activities)
        write_json(os.path.join(DERIVED_DIR, sc, "class_timeline.json"), timeline)

        students = build_student_files(sc, activities)
        for student_id, data in students.items():
            write_json(os.path.join(DERIVED_DIR, sc, "students", f"{student_id}.json"), data)

        print(f"  → {len(timeline)} activities, {len(students)} students")

    print("\nDone.")

if __name__ == "__main__":
    main()
