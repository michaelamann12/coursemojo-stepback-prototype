import "./app.css";
import { DeckShell } from "@components/deck/DeckShell.tsx";
import { TitleSlide } from "@components/deck/TitleSlide.tsx";
import { SectionDividerSlide } from "@components/deck/slides/SectionDividerSlide.tsx";
import { ConnectorSlide } from "@components/deck/slides/ConnectorSlide.tsx";
import { AgendaSlide } from "@components/deck/slides/AgendaSlide.tsx";
import { GoalsSlide } from "@components/deck/slides/GoalsSlide.tsx";
import { SchoolVisionsSlide } from "@components/deck/slides/SchoolVisionsSlide.tsx";
import { TrendsInUseSlide } from "@components/deck/slides/TrendsInUseSlide.tsx";
import { SurveyDataSlide } from "@components/deck/slides/SurveyDataSlide.tsx";
import { OpenResponsesSlide } from "@components/deck/slides/OpenResponsesSlide.tsx";
import { ReflectionSlide } from "@components/deck/slides/ReflectionSlide.tsx";
import { ShareSlide } from "@components/deck/slides/ShareSlide.tsx";
import { UsageNarrativeSlide } from "@components/deck/slides/UsageNarrativeSlide.tsx";
import { UsageDetailSlide } from "@components/deck/slides/UsageDetailSlide.tsx";
import { GrowthNarrativeSlide } from "@components/deck/slides/GrowthNarrativeSlide.tsx";
import { GrowthDetailSlide } from "@components/deck/slides/GrowthDetailSlide.tsx";
import { ImplementationNarrativeSlide } from "@components/deck/slides/ImplementationNarrativeSlide.tsx";
import { ImplementationDetailSlide } from "@components/deck/slides/ImplementationDetailSlide.tsx";
import { PerformanceSnapshotSlide } from "@components/deck/slides/PerformanceSnapshotSlide.tsx";
import { FutureStateSlide } from "@components/deck/slides/FutureStateSlide.tsx";

export function App() {
  return (
    <DeckShell
      slides={[
        { id: "01-cover", render: () => (
          <TitleSlide
            eyebrow="Coursemojo · Stepback Report"
            headline="Prototype ISD"
            subhead="Mid-year data review with district leadership"
            meta="Coursemojo · 2026 Spring Stepback"
          />
        )},
        { id: "02-connector", render: () => <ConnectorSlide /> },
        { id: "03-agenda", render: () => <AgendaSlide /> },
        { id: "04-goals", render: () => <GoalsSlide /> },
        { id: "05-schools", render: () => <SchoolVisionsSlide /> },
        { id: "06-data-review", render: () => (
          <SectionDividerSlide
            eyebrow="Section"
            title="Data Review"
            subtitle="What the data is telling us about Mojo in your classrooms"
          />
        )},
        { id: "07-trends", render: () => <TrendsInUseSlide /> },
        { id: "08-survey", render: () => <SurveyDataSlide /> },
        { id: "09-open-responses", render: () => <OpenResponsesSlide /> },
        { id: "10-reflection", render: () => <ReflectionSlide /> },
        { id: "11-share", render: () => <ShareSlide /> },
        { id: "12-usage-narrative", render: () => <UsageNarrativeSlide /> },
        { id: "13-usage-detail", render: () => <UsageDetailSlide /> },
        { id: "14-growth-narrative", render: () => <GrowthNarrativeSlide /> },
        { id: "15-growth-detail", render: () => <GrowthDetailSlide /> },
        { id: "16-impl-narrative", render: () => <ImplementationNarrativeSlide /> },
        { id: "17-impl-detail", render: () => <ImplementationDetailSlide /> },
        { id: "18-performance", render: () => <PerformanceSnapshotSlide /> },
        { id: "19-future-this-year", render: () => <FutureStateSlide variant="this-year" /> },
        { id: "20-future-next-year", render: () => <FutureStateSlide variant="next-year" /> },
      ]}
    />
  );
}
