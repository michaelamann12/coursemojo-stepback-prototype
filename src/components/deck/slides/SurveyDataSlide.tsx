import { Slide } from "../Slide.tsx";

/** Slide 8 — Survey data. Pulled from end-of-period survey (placeholder values). */
export function SurveyDataSlide() {
  return (
    <Slide
      eyebrow="What teachers and students told us"
      title="Survey data"
      lead="From the mid-year survey across Prototype ISD."
    >
      <div class="survey-grid">
        <div class="survey-block">
          <div class="survey-block-header">
            <span class="survey-pill">Teachers</span>
            <span class="survey-n">n = 50</span>
          </div>
          <ul class="survey-bullets">
            <li><strong>96%</strong> say Mojo has a positive impact on student learning</li>
            <li><strong>88%</strong> say Mojo helps them implement their curriculum</li>
            <li><strong>84%</strong> say Mojo helps them respond to student data and misconceptions</li>
          </ul>
        </div>
        <div class="survey-block survey-block--coral">
          <div class="survey-block-header">
            <span class="survey-pill">Students</span>
            <span class="survey-n">n = 2,991</span>
          </div>
          <ul class="survey-bullets">
            <li><strong>69%</strong> say Mojo activities help them learn</li>
            <li><strong>82%</strong> are more likely to participate in class after a Mojo activity</li>
            <li><strong>91%</strong> keep trying even when an activity is hard</li>
          </ul>
        </div>
      </div>
    </Slide>
  );
}
