import { Slide } from "../Slide.tsx";

const SCHOOLS = [
  {
    name: "Lincoln Middle",
    grades: "Grades 6–8",
    vision:
      "Every student leaves middle school able to make a claim and back it with evidence.",
  },
  {
    name: "Roosevelt Academy",
    grades: "Grades 6–8",
    vision:
      "Reading is a daily habit — and feedback on writing is fast enough to act on.",
  },
  {
    name: "Eastside Prep",
    grades: "Grades 7–8",
    vision:
      "Teachers spend their planning time on instruction, not grading. Students get same-day feedback.",
  },
];

/** Slide 5 — School Visions. Placeholder cards; Success team swaps in real schools. */
export function SchoolVisionsSlide() {
  return (
    <Slide
      eyebrow="The schools doing the work"
      title="School visions"
      lead="What our partner schools said they wanted from this year's Mojo work."
    >
      <div class="schools-grid">
        {SCHOOLS.map((s) => (
          <div class="school-card" key={s.name}>
            <div class="school-card-name">{s.name}</div>
            <div class="school-card-grades">{s.grades}</div>
            <p class="school-card-vision">"{s.vision}"</p>
          </div>
        ))}
      </div>
    </Slide>
  );
}
