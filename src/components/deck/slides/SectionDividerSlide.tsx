interface SectionDividerSlideProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
}

/** Deep-indigo section break — used between major deck sections. */
export function SectionDividerSlide({ eyebrow, title, subtitle }: SectionDividerSlideProps) {
  return (
    <div class="slide slide-title-bg slide-section">
      {eyebrow ? <div class="title-eyebrow">{eyebrow}</div> : null}
      <h1 class="title-headline section-headline">{title}</h1>
      <span class="section-rule" aria-hidden="true" />
      {subtitle ? <p class="title-subhead">{subtitle}</p> : null}
    </div>
  );
}
