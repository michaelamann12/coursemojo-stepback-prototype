import { Slide } from "../Slide.tsx";

/** Slide 4 — Our goals. */
export function GoalsSlide() {
  return (
    <Slide
      eyebrow="Setting the frame"
      title="Our goals"
      lead="The north stars guiding Prototype ISD's work with Mojo this year."
    >
      <div class="goals-grid">
        <div class="deck-card deck-card--coral">
          <div class="deck-card-title">District goals</div>
          <div class="deck-card-body">
            <ul class="deck-bullets deck-bullets--diamond">
              <li>Lift student ELA achievement across grades 6–8, with focus on close reading and evidence-based writing</li>
              <li>Continuous PD for teachers anchored in real student data, not generic training</li>
              <li>Responsible AI use — every classroom tool aligned to the District AI Policy</li>
            </ul>
          </div>
        </div>
        <div class="deck-card">
          <div class="deck-card-title">Goals for the Mojo partnership</div>
          <div class="deck-card-body">
            <ul class="deck-bullets">
              <li>Make every student writer's thinking visible to their teacher</li>
              <li>Free up class time for discussion and reteach by automating the grading + feedback loop</li>
              <li>Give leaders a clear, actionable picture of how each school is progressing</li>
            </ul>
          </div>
        </div>
      </div>
    </Slide>
  );
}
