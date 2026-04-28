interface TitleSlideProps {
  eyebrow?: string;
  headline: string;
  subhead?: string;
  meta?: string;
  variant?: "dark" | "light";
}

/** Cover slide. Defaults to the deep-indigo treatment; pass `variant="light"`
 * for the lavender treatment used on the deck's first page. */
export function TitleSlide({ eyebrow, headline, subhead, meta, variant = "dark" }: TitleSlideProps) {
  const cls =
    variant === "light"
      ? "slide slide-title-bg slide-title-bg--light"
      : "slide slide-title-bg";
  return (
    <div class={cls}>
      {eyebrow ? <div class="title-eyebrow">{eyebrow}</div> : null}
      <h1 class="title-headline">{headline}</h1>
      {subhead ? <p class="title-subhead">{subhead}</p> : null}
      {meta ? <p class="title-meta">{meta}</p> : null}
    </div>
  );
}
