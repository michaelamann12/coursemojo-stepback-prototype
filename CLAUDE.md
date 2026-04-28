# CLAUDE
You are assisting a developer in creating an interactive demo project for the Mojo messaging application. The goal is to create a prototype feature that satisfies the following goal ...

##### Goal
<YOUR LAB EXPERIMENT GOAL HERE>

## Current State

The app skeleton is ready — run `npm run dev` and open `http://localhost:5173` (or 5174 if 5173 is taken).

### What's been set up
- **Welcome page** — `src/components/WelcomePage.tsx` / `WelcomePage.css` — dark purple landing page using Mojo design tokens, shown on load. Replace or extend this as the entry point for your prototype.
- **Packet data** — 672 activity packets copied to `public/packets/` (gitignored). Index at `public/packets/index.json`. Fetch helper at `src/lib/packets.ts`.
- **App entry** — `src/app.tsx` renders `<WelcomePage />`. Swap this out when you're ready to build.
- **Material Icons** — loaded via Google Fonts `<link>` in `index.html`. Use `<span class="material-symbols-outlined">icon_name</span>` anywhere. Add the `filled` class for filled variants.

### Dev commands
```bash
npm run dev          # start Vite on :5173 (or next available port)
npm run graphql:dev  # optional — only needed if using the live DB
```

## Platform Context

**CourseMojo** is a K-12 ELA (English Language Arts) educational platform. Students use **Mojo** — a chat-based interface — to complete literacy activities assigned by their teacher. Teachers assign activities to classes via **short codes** (class join codes). Activities are built around text excerpts from curriculum providers like StudySync.

### How Mojo activities work
1. Students join a class with a short code and are assigned an activity
2. The activity presents a **text excerpt** (novel, speech, article) and a sequence of **questions**
3. Questions are grouped into two sections:
   - **Section 0 — Standard questions**: Text-dependent comprehension questions (`tdq-v-2`) and multiple choice (`mpchoice`). When a student gets one wrong, the AI provides **scaffolding** (coaching) to help them try again.
   - **Section 1 — Target task**: The culminating exit-ticket questions (`mpchoice-target-task`). These are the questions teachers care most about.
4. The session tracks how far each student gets and whether they answered correctly on the first try, after scaffolding, or never

### Activity types in this dataset
| Type | Description |
|---|---|
| `literal_comp` | Literal comprehension — replaces Quiz & Think in StudySync |
| `closeread` | Close reading of the text |
| `language` | Language / vocabulary skills |
| `multistep` | Multi-step writing or analysis task |
| `writing` | Extended writing activity |

### Key concepts
- **Short code** — a class join code (e.g. `2PTG2D`). One short code = one teacher's class.
- **Packet** — one class's data for one activity. Each packet UUID matches an activity assigned to that class.
- **Scaffolding** — when a student answers incorrectly, the AI guides them toward the right answer. `pct_correct_after_scaffolding` measures how many students got it right on the retry.
- **Target task** — the exit ticket / culminating questions (Section 1). `students_reached_target_task` is a key teacher metric.
- **Students of concern** — students automatically flagged for teacher follow-up:
  - `no_responses` — started but submitted no answers
  - `low_completion` — didn't finish the activity
  - `never_correct_target` — couldn't get the target task right even with help
  - `all_flagged` — all their responses were flagged as inappropriate

# Tools

## Data

There are three categories of data files, all served as static assets from `public/`. Run `python3 scripts/generate-derived.py` from the project root to rebuild everything from the raw packets.

```
public/
  packets/
    index.json                          ← short code → [uuid, ...] index
    {SHORT_CODE}/
      {uuid}.json                       ← enriched activity packet (one per class × activity)
  derived/
    {SHORT_CODE}/
      class_timeline.json               ← all activities for a class, sorted curriculum order
      students/
        {USER_ID}.json                  ← one student's full history across all activities
  standards.json                        ← MOJO standards taxonomy with state crosswalks
```

---

### 1. Enriched Packet — `public/packets/{SC}/{uuid}.json`

Two top-level keys: `activity_data_packet` (class-level aggregates) and `transcript_data` (per-student responses). The packets are pre-enriched — `generate-derived.py` modifies them in place during Pass 1.

#### `activity_data_packet`

```json
{
  "activity_metadata": {
    "text_title": "A Wrinkle in Time",
    "excerpt": "<p>...</p>",           // full HTML of the text students read
    "objective": "...",
    "alignment_long": "...",
    "alignment_short": "...",
    "grade_level": 6,
    "curriculum_provider": "StudySync",
    "type": "literal_comp",            // literal_comp | closeread | language | multistep | writing
    "unit_name": "3",
    "lesson_number": "24",
    "exit_ticket": ["...", "..."],
    "questions_map": [
      {
        "question_label": "Question 1",
        "section": 0,                  // 0 = standard questions, 1 = target task (exit ticket)
        "step": 0,
        "question_role": "standard",   // standard | target_task | driving_question | target_task_primary | target_task_scaffold
        "question_type": "tdq-v-2",    // tdq-v-2 | mpchoice | mpchoice-target-task | highlight-as-answer
        "question": "...",
        "mojo_standard": "MOJO.ANALYZE-CHARACTER"  // ← added by generate-derived.py
      }
    ]
  },
  "completion_funnel": {
    "students_enrolled": 28,
    "students_with_sessions": 20,
    "students_without_sessions": 8,
    "students_with_responses": 18,
    "students_reached_target_task": 13,
    "students_scored_on_target_task": 11
  },
  "per_question_breakdown": [
    {
      "question_label": "Question 2",
      "section": 0,
      "step": 1,
      "question_text": "...",
      "question_role": "standard",
      "student_count": 18,
      "pct_correct_first": 50.0,
      "pct_correct_after_scaffolding": 33.3,
      "pct_never_correct": 16.7
    }
  ],
  "flagged_responses": {
    "flagged_response_count": 11,
    "flagged_student_count": 7
  },
  "students_of_concern": [
    {
      "student_id": "USER_1",
      "concern_type": "no_responses",  // no_responses | low_completion | never_correct_target | all_flagged
      "detail": "started activity but submitted no responses"
    }
  ],
  "overrides": {
    "override_count": 0,
    "override_student_count": 0
  },
  "teacher_actions": {                 // ← added by generate-derived.py (deterministic mock)
    "app_usage": {
      "fast_forward": { "used": true },
      "add_time": { "used": false, "times_used": 0 },
      "pause": { "used": true, "pause_count": 1 },
      "viewed_transcripts": { "used": true, "student_ids": ["USER_1", "USER_6"] }
    },
    "tool_usage": {
      "misconception_tool": { "used": false },
      "celebrations_tool": { "used": true },
      "conferences_tool": {
        "used": true,
        "student_groups": [
          { "concern_type": "never_correct_target", "student_ids": ["USER_3", "USER_5"] }
        ]
      },
      "post_activity_summary": { "used": true }
    }
  }
}
```

#### `transcript_data`

Keyed by student ID. Each value is an array of question entries in section/step order.

```json
{
  "USER_1": [
    {
      "question_label": "Question 2",
      "question": "...",
      "section": 0,
      "step": 1,
      "responses": [
        {
          "attempt_num": 1,
          "content": "student's actual response text",
          "bucket_label": "incorrect",      // correct | partial-understanding | incorrect | limited-effort | Flagged | null
          "bucket_rationale": "AI rationale for this grade",
          "point_value": 1,
          "points_possible": 2,
          "canonical_blocker": "comprehend-text"  // ← replaces bucket_label_secondary; null if not applicable
        },
        {
          "attempt_num": 2,                 // second attempt after AI scaffolding
          "content": "revised response",
          "bucket_label": "correct",
          "bucket_rationale": "...",
          "point_value": 2,
          "points_possible": 2,
          "canonical_blocker": null
        }
      ]
    }
  ]
}
```

**Canonical blocker taxonomy** (assigned to incorrect/partial responses):

| Tier | Blockers |
|---|---|
| Tier 1 — Access | `task`, `vocabulary`, `syntax`, `background-knowledge` |
| Tier 2 — Foundational | `comprehend-text` |
| Tier 3 — Analyze | `cite-evidence`, `analyze-character`, `analyze-craft`, `analyze-theme`, `compare-contrast`, `analyze-argument`, `synthesize` |
| Tier 4 — Communicate | `focus`, `evidence`, `development`, `organization` |

**MOJO Standards** (8 total, see `public/standards.json` for full crosswalks):
`MOJO.CITE-EVIDENCE` · `MOJO.ANALYZE-CHARACTER` · `MOJO.ANALYZE-CRAFT` · `MOJO.ANALYZE-THEME` · `MOJO.ANALYZE-ARGUMENT` · `MOJO.COMPARE-CONTRAST` · `MOJO.WRITE-ARGUMENT` · `MOJO.SYNTHESIZE`

**Helper:** Import from `@lib/packets`:
```ts
import {
  getShortCodes, getPacketIds,
  getPacket, getTranscript, getFullPacket,
  getAllPacketsForShortCode,
  finalBucket, isEventuallyCorrect, correctOnFirstAttempt, neededScaffolding
} from "@lib/packets";

const codes  = await getShortCodes();                        // string[]
const packet = await getPacket("2PTG2D", "<uuid>");          // ActivityPacket (class aggregates)
const tx     = await getTranscript("2PTG2D", "<uuid>");      // TranscriptData — per-student
const full   = await getFullPacket("2PTG2D", "<uuid>");      // { activity_data_packet, transcript_data }
const all    = await getAllPacketsForShortCode("2PTG2D");     // ActivityPacket[]
```

---

### 2. Class Timeline — `public/derived/{SC}/class_timeline.json`

An array of activity summaries for one class, sorted by `unit` + `lesson` (curriculum order). One entry per activity the class was assigned. Fetch with a plain `fetch("/derived/{SC}/class_timeline.json")`.

```json
[
  {
    "activity_id": "c7ad86bf-...",
    "unit": "1",
    "lesson": "1",
    "text_title": "Eleven",
    "activity_type": "literal_comp",
    "grade_level": 6,
    "questions_map": [              // same shape as packet questions_map, includes mojo_standard
      {
        "question_label": "Question 1",
        "section": 0,
        "step": 0,
        "question_role": "standard",
        "question_type": "mpchoice",
        "question": "...",
        "mojo_standard": "MOJO.ANALYZE-CRAFT"
      }
    ],
    "completion_funnel": {          // same shape as packet completion_funnel
      "students_enrolled": 28,
      "students_with_sessions": 20,
      "students_without_sessions": 8,
      "students_with_responses": 18,
      "students_reached_target_task": 13,
      "students_scored_on_target_task": 11
    },
    "avg_pct_correct_first": 45.2,       // class average across all questions
    "avg_pct_correct_scaffolding": 28.1,
    "avg_pct_never_correct": 26.7,
    "top_blockers": [                    // most frequent canonical blockers for this activity
      { "blocker": "comprehend-text", "tier": 2, "count": 14 }
    ],
    "standards_assessed": {              // standard → number of questions covering it
      "MOJO.ANALYZE-CRAFT": 2,
      "MOJO.ANALYZE-CHARACTER": 2,
      "MOJO.CITE-EVIDENCE": 2,
      "MOJO.SYNTHESIZE": 2
    },
    "students_of_concern": [            // same shape as packet students_of_concern
      {
        "student_id": "USER_1",
        "concern_type": "never_correct_target",
        "detail": "attempted target task but never reached correct"
      }
    ],
    "teacher_actions": {                // same shape as packet teacher_actions
      "app_usage": { ... },
      "tool_usage": { ... }
    }
  }
]
```

---

### 3. Student File — `public/derived/{SC}/students/{USER_ID}.json`

One file per student, containing their complete history across all activities for that class. Fetch with `fetch("/derived/{SC}/students/{userId}.json")`.

```json
{
  "student_id": "USER_27",
  "short_code": "2PTG2D",
  "concern_flags": ["never_correct_target"],  // concern_types that appear anywhere in their history
  "top_blockers": [                           // most frequent blockers rolled up across all activities
    { "blocker": "comprehend-text", "tier": 2, "count": 8 }
  ],
  "activities": [
    {
      "activity_id": "c7ad86bf-...",
      "unit": "1",
      "lesson": "1",
      "text_title": "Eleven",
      "activity_type": "literal_comp",
      "concern_type": null,                   // concern_type for this activity, or null
      "summary": {
        "questions_attempted": 4,
        "reached_target_task": true,
        "pct_correct_first": 25.0,
        "pct_needed_scaffolding": 50.0,
        "pct_never_correct": 25.0,
        "target_task_correct": 1,
        "target_task_count": 2,
        "blocker_counts": {                   // canonical_blocker → occurrence count
          "comprehend-text": 2
        }
      },
      "questions": [
        {
          "question_label": "Question 3",
          "question": "...",
          "section": 0,
          "step": 2,
          "mojo_standard": "MOJO.CITE-EVIDENCE",
          "correct_first": false,
          "eventually_correct": true,
          "needed_scaffolding": true,
          "never_correct": false,
          "final_bucket": "correct",
          "attempt_count": 2,
          "responses": [                      // full response objects, same shape as transcript_data
            {
              "attempt_num": 1,
              "content": "...",
              "bucket_label": "incorrect",
              "bucket_rationale": "...",
              "point_value": 1,
              "points_possible": 2,
              "canonical_blocker": "comprehend-text"
            },
            {
              "attempt_num": 2,
              "content": "...",
              "bucket_label": "correct",
              "bucket_rationale": "...",
              "point_value": 2,
              "points_possible": 2,
              "canonical_blocker": null
            }
          ]
        }
      ]
    }
  ]
}

---

### GraphQL / PostgreSQL (available but not required)

This project also has a GraphQL adapter that connects directly to the local `coursemojo` PostgreSQL database. It is powered by **PostGraphile v4**, which introspects the live schema and auto-generates a full GraphQL API — no resolvers to write.

### Starting the GraphQL server

```bash
# 1. Copy the env template and fill in your local DB credentials
cp graphql/.env.example graphql/.env

# 2. Start the server (deps are shared with the root project)
npm run graphql:dev
```

The server starts on `http://localhost:5001`. The Vite dev server (port 5173) proxies all `/graphql` requests there, so frontend code never references the port directly.

- **GraphiQL explorer** (use this to browse the schema and draft queries):
  `http://localhost:5001/graphiql`
- **GraphQL endpoint** (used by the frontend helper):
  `http://localhost:5001/graphql`

### Querying from a component

Import the `query<T>()` helper from `@lib/graphql`:

```ts
import { query } from "@lib/graphql";

// Define the shape of the data you expect back
interface SessionNode {
  id: string;
  userId: string;
  percentageComplete: number;
  activityId: string;
}

interface SessionsData {
  allSessions: {
    nodes: SessionNode[];
  };
}

// Call it — returns a typed Promise
const data = await query<SessionsData>(`
  query {
    allSessions(first: 20, orderBy: CREATED_TIMESTAMP_DESC) {
      nodes {
        id
        userId
        percentageComplete
        activityId
      }
    }
  }
`);

console.log(data.allSessions.nodes);
```

Variables are also supported:

```ts
const data = await query<SessionsData>(
  `query($userId: String!) {
     allSessions(condition: { userId: $userId }, first: 10) {
       nodes { id percentageComplete }
     }
   }`,
  { userId: "abc-123" }
);
```

### PostGraphile naming conventions

PostGraphile converts PostgreSQL snake_case names to GraphQL camelCase automatically:

| PostgreSQL | GraphQL |
|---|---|
| `sessions` table | `allSessions` (list) / `sessionById` (single) |
| `user_login_tokens` table | `allUserLoginTokens` / `userLoginTokenByUserId` |
| `percentage_complete` column | `percentageComplete` |
| `created_timestamp` column | `createdTimestamp` |

Every table gets:
- `allTableName` — paginated list with `first`, `last`, `offset`, `orderBy`, `condition`, and `filter` args
- `tableNameById` (or by primary key) — fetch a single row

Use **GraphiQL** (`http://localhost:5001/graphiql`) to explore autocomplete, read field descriptions, and test queries before wiring them into components.

### Available tables

The following PostgreSQL tables are exposed through the GraphQL API:

| Table | Key columns | Notes |
|---|---|---|
| `sessions` | `id`, `user_id`, `activity_id`, `short_code`, `percentage_complete`, `current_points`, `latest` | Core student session records |
| `session_results` | `id`, `session_id`, `section`, `step`, `response`, `bucket_label`, `point_value` | Per-step grading results |
| `session_step_overrides` | `session_id`, `section_index`, `step_index`, `bucket_label_override` | Manual grade overrides |
| `session_insights_results` | `id`, `created_by`, `analysis_type`, `result`, `query_fields` | AI-generated insights |
| `session_insights_deployments` | `id`, `external_id`, `title`, `analysis_type`, `is_enabled` | Insights tool configuration |
| `user_login_tokens` | `user_id`, `user_name`, `email`, `email_domain`, `last_login` | User accounts |
| `user_attributes` | `user_id`, `user_role`, `modifiers` | Roles: `student`, `teacher`, `school_leader`, `district_leader` |
| `user_demographics` | `user_id`, `grade_level`, `school`, `district`, `gender` | Student demographic data |
| `user_short_code_settings` | `user_id`, `short_code`, `chat_translation`, `tts`, `stt` | Per-user accessibility settings |
| `short_codes` | `short_code`, `title`, `deleted` | Class join codes |
| `short_code_activities` | `short_code`, `activity_id`, `activity_title`, `curriculum_id` | Activities assigned to a class |
| `teacher_shortcode_permissions` | `user_id`, `code` | Which teachers own which short codes |
| `curriculum_groups` | `id`, `name`, `curriculum_id`, `company_id` | Curriculum groupings |
| `user_curriculum_groups` | `user_id`, `curriculum_group_id` | User ↔ curriculum membership |
| `admin_groups` | `id`, `name`, `description` | Admin permission groups |
| `admin_group_memberships` | `admin_group_id`, `user_id` | Admin group membership |
| `admin_group_permissions` | `admin_group_id`, `feature`, `action` | Feature-level permissions |
| `user_groups` | `id`, `name`, `description` | Educator groups |
| `user_group_memberships` | `user_group_id`, `user_id`, `role` | Group membership with `leader`/`member` roles |
| `classification_bucket_configs` | `bucket_label`, `display_name`, `style` | Grading bucket configuration |
| `user_flagged_messages` | `session_id`, `content`, `reasons` | Student-flagged chat messages |
| `csv_processing_tasks` | `id`, `task_type`, `status`, `user_id`, `processed_count` | Bulk import job queue |

> All tables also have audit columns: `created_timestamp`, `updated_timestamp`, `created_by`, `updated_by`.

### Example queries to get started

**Recent sessions for a short code:**
```graphql
query {
  allSessions(
    condition: { shortCode: "ABC123", latest: true }
    orderBy: LAST_USER_INTERACTION_DESC
    first: 50
  ) {
    nodes {
      id
      userId
      percentageComplete
      currentPoints
      activityId
    }
  }
}
```

**Step results for a session:**
```graphql
query($sessionId: String!) {
  allSessionResults(condition: { sessionId: $sessionId }, orderBy: SECTION_ASC) {
    nodes {
      section
      step
      response
      bucketLabel
      pointValue
      pointsPossible
    }
  }
}
```

**Users by role:**
```graphql
query {
  allUserAttributes(condition: { userRole: "teacher" }, first: 100) {
    nodes {
      userId
      userRole
      userLoginTokenByUserId {
        userName
        email
        emailDomain
      }
    }
  }
}
```

---

## Frontend Components
To help in aligning this project with the visual design language of the real Mojo application, you have the following style files and components available. 

##### Styles
These shared, base styles are all located in the `src/styles/` directory ...
- `colors.css` — the color scheme used in the Mojo application
- `font.css` — imports for "Be Vietnam Pro" and the material icon library fonts, the icon library of choice for Mojo
- `sizing.css` — common sizes used for buttons, text, and margins
- `text.css` — shared styles for headings, sub-titles, and so on

##### Components
These are generic components you may use to get started with the user interface. They are found in the `src/components/` directory ...
- `icons/Icon.tsx`
- `buttons/IconButton.tsx`
- `inputs/dropdown/DrodownSingleSelect.tsx`
- `inputs/slider/Slider.tsx`
- `inputs/toggle/Toggle.tsx`
- `inputs/CheckBox.tsx`
- `inputs/SearchBox.tsx`
- `inputs/TextBox.tsx`
- `popovers/Tooltip.tsx`
