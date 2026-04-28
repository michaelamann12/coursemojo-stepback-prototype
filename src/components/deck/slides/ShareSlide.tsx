import { Slide } from "../Slide.tsx";

/** Slide 11 — Share-out. Two columns to capture team responses live. */
export function ShareSlide() {
  return (
    <Slide
      eyebrow="Share-out"
      title="What we heard"
      lead="Capture the strengths and challenges your team named."
    >
      <div class="share-grid">
        <div class="share-card share-card--strengths">
          <div class="share-card-header">Strengths</div>
          <div class="share-card-body">
            <p class="share-placeholder">— Capture team responses here —</p>
          </div>
        </div>
        <div class="share-card share-card--challenges">
          <div class="share-card-header">Challenges</div>
          <div class="share-card-body">
            <p class="share-placeholder">— Capture team responses here —</p>
          </div>
        </div>
      </div>
    </Slide>
  );
}
