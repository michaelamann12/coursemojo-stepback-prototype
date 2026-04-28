interface TitleSlideProps {
  eyebrow?: string;
  headline: string;
  subhead?: string;
  meta?: string;
}

/** Deep-indigo cover slide. */
export function TitleSlide({ eyebrow, headline, subhead, meta }: TitleSlideProps) {
  return (
    <div class="slide slide-title-bg">
      {eyebrow ? <div class="title-eyebrow">{eyebrow}</div> : null}
      <h1 class="title-headline">{headline}</h1>
      {subhead ? <p class="title-subhead">{subhead}</p> : null}
      {meta ? <p class="title-meta">{meta}</p> : null}
    </div>
  );
}
