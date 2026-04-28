import { Slide } from "../Slide.tsx";

/** Slide 7 — Trends in use. Discussion prompts. */
export function TrendsInUseSlide() {
  return (
    <Slide
      eyebrow="Open the floor"
      title="Trends in use"
      lead="Before we go to the data — what are you seeing?"
    >
      <div class="prompts-grid">
        <div class="prompt-card">
          <span class="prompt-num">01</span>
          <div class="prompt-text">
            Where are we seeing <strong>strong use</strong> of Coursemojo? Why?
          </div>
        </div>
        <div class="prompt-card">
          <span class="prompt-num">02</span>
          <div class="prompt-text">
            Where are we seeing <strong>lower usage</strong>? Why?
          </div>
        </div>
        <div class="prompt-card">
          <span class="prompt-num">03</span>
          <div class="prompt-text">
            What other feedback are you hearing from teachers and leaders about
            Coursemojo — product or implementation?
          </div>
        </div>
      </div>
    </Slide>
  );
}
