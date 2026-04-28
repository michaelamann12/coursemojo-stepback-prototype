import { Slide } from "../Slide.tsx";

const STUDENT_QUOTES = [
  "I like how it's enthusiastic about writing and makes it feel more like an activity rather than an assignment.",
  "It demands participation from every student.",
  "There has been great improvement since last year. Thank you!",
];

const TEACHER_QUOTES = [
  "What I enjoy about Course Mojo is how Mojo tries to help us when we get stuck and where to redirect us.",
  "Students in my inclusion class struggle with CourseMojo. The program wants very specific answers — I'd like an override feature.",
  "I think this tool can be fantastic, but there needs to be greater balance between the ideal answer and an answer close to the ballpark.",
];

/** Slide 9 — Open responses. Quote cards from student and teacher surveys. */
export function OpenResponsesSlide() {
  return (
    <Slide
      eyebrow="In their own words"
      title="Open responses"
      lead="What people wrote when we asked them how Mojo is going."
    >
      <div class="quotes-grid">
        <div class="quotes-col">
          <div class="quotes-col-header">
            <span class="survey-pill">Students</span>
          </div>
          {STUDENT_QUOTES.map((q, i) => (
            <blockquote class="quote-card" key={`s${i}`}>
              <span class="quote-mark">"</span>
              <p>{q}</p>
            </blockquote>
          ))}
        </div>
        <div class="quotes-col">
          <div class="quotes-col-header">
            <span class="survey-pill">Teachers</span>
          </div>
          {TEACHER_QUOTES.map((q, i) => (
            <blockquote class="quote-card quote-card--coral" key={`t${i}`}>
              <span class="quote-mark">"</span>
              <p>{q}</p>
            </blockquote>
          ))}
        </div>
      </div>
    </Slide>
  );
}
