import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { CloudRain, Droplets, Flame, Mountain, Sun } from "lucide-react";
import { useFarm, useFarmClimate } from "@/lib/farm-context";
import { computeStats } from "@/lib/agri/climate";
import { assessRisks, type RiskAssessment } from "@/lib/agri/risk";
import { pageHead } from "@/lib/head";
import { Panel, PageHeader } from "@/components/app/Panel";
import { RiskBadge, riskBar } from "@/components/app/RiskBadge";
import { ErrorState, LoadingState } from "@/components/app/DataState";
import { SourceNote } from "@/components/app/SourceBadge";

export const Route = createFileRoute("/risk")({
  head: () => pageHead("Risk Analysis", "Drought, excess rainfall, heat stress, water and soil degradation risk with supporting evidence."),
  component: RiskPage,
});

const ICONS: Record<RiskAssessment["id"], typeof Sun> = { drought: Sun, excess_rain: CloudRain, heat: Flame, water: Droplets, soil: Mountain };

function RiskPage() {
  const { farm } = useFarm();
  const q = useFarmClimate();
  const risks = useMemo(() => (q.data ? assessRisks(computeStats(q.data.days), farm) : []), [q.data, farm]);

  return (
    <div className="space-y-6">
      <PageHeader title="Risk Analysis" description="Screening indicators for the last 90 days of observations at your farm. Levels: Low (0–34), Moderate (35–64), High (65–100)." />
      {q.isLoading ? <Panel><LoadingState /></Panel> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {risks.map((r) => {
            const Icon = ICONS[r.id];
            return (
              <Panel key={r.id}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2"><span className="rounded-md bg-secondary p-2 text-primary"><Icon className="h-4 w-4" /></span><h2 className="text-sm font-semibold">{r.label}</h2></div>
                  <RiskBadge level={r.level} />
                </div>
                <div className="mt-4 flex items-baseline gap-1"><span className="font-mono text-3xl font-semibold">{r.score}</span><span className="text-xs text-muted-foreground">/100</span></div>
                <div className="mt-2 h-1.5 rounded-full bg-muted"><div className={`h-full rounded-full ${riskBar[r.level]}`} style={{ width: `${r.score}%` }} /></div>
                <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">Evidence</p>
                <ul className="mt-1.5 space-y-1 text-xs">{r.evidence.map((e) => <li key={e} className="flex gap-1.5"><span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-muted-foreground" />{e}</li>)}</ul>
                <p className="mt-4 rounded-md bg-secondary p-2.5 text-xs"><b>Suggested action: </b>{r.action}</p>
              </Panel>
            );
          })}
          <Panel title="How these are calculated">
            <p className="text-xs leading-relaxed text-muted-foreground">Each indicator combines observed NASA POWER values (dry spells, heavy-rain days, hot days, radiation) with your farm profile (soil type, pH, organic carbon, water availability). They highlight where to look closer; they are not forecasts and do not replace field inspection or official advisories.</p>
          </Panel>
        </div>
      )}
      <SourceNote data={q.data} />
    </div>
  );
}
