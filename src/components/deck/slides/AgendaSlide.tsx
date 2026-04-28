import { Slide } from "../Slide.tsx";

/** Slide 3 — Today's agenda. */
export function AgendaSlide() {
  return (
    <Slide eyebrow="Welcome" title="Today's agenda" lead="What we're covering in our 60 minutes together.">
      <ul class="deck-bullets deck-bullets--diamond agenda-list">
        <li>
          <strong>Review progress</strong> toward Prototype ISD's goals with the Mojo
          partnership over the past 18 months
        </li>
        <li>
          <strong>Walk the data</strong> — student engagement, teacher implementation,
          and academic performance
        </li>
        <li>
          <strong>Surface patterns</strong> in classrooms where Mojo is working well —
          and where teachers need support
        </li>
        <li>
          <strong>Vision together</strong> about what's possible this year and next
        </li>
      </ul>
    </Slide>
  );
}
