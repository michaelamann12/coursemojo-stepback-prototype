import { Slide } from "../Slide.tsx";

interface FutureStateSlideProps {
  variant: "this-year" | "next-year";
}

const THIS_YEAR_GROUPS = [
  {
    audience: "Students",
    text: "More students reaching the target task — especially multilingual learners and students with IEPs — through scaffolded support that meets them where they are.",
  },
  {
    audience: "Teachers",
    text: "PLCs use Mojo data as the warm-up to every meeting. Less time grading, more time planning the reteach.",
  },
  {
    audience: "Schools",
    text: "Every campus identifies the 1-2 standards most blocking growth and runs a focused reteach cycle by spring.",
  },
  {
    audience: "District",
    text: "A clear, coachable picture of where each school is — usable in board updates without rework.",
  },
];

const NEXT_YEAR_GROUPS = [
  {
    audience: "Students",
    text: "Mojo writing data follows the student across grades — building a longitudinal portrait of growth.",
  },
  {
    audience: "Teachers",
    text: "Onboarding is a one-week cycle, not a semester. New hires hit the 2+ activities/week threshold by week 3.",
  },
  {
    audience: "PLCs",
    text: "Standing PLC agenda anchored on Mojo data — Tuesday's blocker becomes Wednesday's mini-lesson.",
  },
  {
    audience: "Schools",
    text: "Every school owns its Mojo implementation strategy — site leaders can name their growth goals in plain language.",
  },
  {
    audience: "District",
    text: "Mojo is a load-bearing input to district-wide ELA strategy — not a tool we use, but a partner we plan with.",
  },
];

export function FutureStateSlide({ variant }: FutureStateSlideProps) {
  const groups = variant === "this-year" ? THIS_YEAR_GROUPS : NEXT_YEAR_GROUPS;
  const eyebrow = variant === "this-year" ? "Looking forward · Spring '26" : "Looking forward · '26-'27";
  const title = variant === "this-year" ? "What's possible by year's end" : "What's possible next year";
  const lead =
    variant === "this-year"
      ? "If the pieces above stay in motion through spring, here's what the data should show in June."
      : "Bigger frame: if Prototype ISD doubles down on what's working, what does '26-'27 look like?";
  return (
    <Slide eyebrow={eyebrow} title={title} lead={lead}>
      <div class="future-grid">
        {groups.map((g) => (
          <div class="future-card" key={g.audience}>
            <div class="future-card-audience">For {g.audience.toLowerCase()}</div>
            <p class="future-card-text">{g.text}</p>
          </div>
        ))}
      </div>
    </Slide>
  );
}
