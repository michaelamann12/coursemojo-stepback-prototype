import type { ComponentChildren } from "preact";

interface SlideProps {
  eyebrow?: string;
  title: string;
  lead?: string;
  children: ComponentChildren;
}

/** Standard content slide — lavender bg, coral-bar title. */
export function Slide({ eyebrow, title, lead, children }: SlideProps) {
  return (
    <div class="slide">
      {eyebrow ? <div class="slide-eyebrow">{eyebrow}</div> : null}
      <div class="slide-title-row">
        <span class="slide-accent-bar" aria-hidden="true" />
        <h1 class="slide-title">{title}</h1>
      </div>
      {lead ? <p class="slide-lead">{lead}</p> : null}
      <div class="slide-body">{children}</div>
    </div>
  );
}
