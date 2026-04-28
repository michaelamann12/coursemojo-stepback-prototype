import { Slide } from "../Slide.tsx";

/** Slide 10 — Reflection prompts. */
export function ReflectionSlide() {
  return (
    <Slide
      eyebrow="Pause and reflect"
      title="Reflection"
      lead="Take a moment with your team. We'll share out next."
    >
      <div class="prompts-grid prompts-grid--two">
        <div class="prompt-card prompt-card--accent">
          <span class="prompt-num">01</span>
          <div class="prompt-text">
            Where do you see <strong>strengths</strong> in your district's
            implementation of Coursemojo?
          </div>
        </div>
        <div class="prompt-card">
          <span class="prompt-num">02</span>
          <div class="prompt-text">
            What have been the <strong>challenges</strong> in your district's
            implementation of Coursemojo?
          </div>
        </div>
      </div>
    </Slide>
  );
}
