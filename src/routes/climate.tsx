import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { AlertCircle } from "lucide-react";
import { useFarm } from "@/lib/farm-context";
import { climateQuery, defaultRange, fmtPowerDate, toPowerDate } from "@/lib/nasa/queries";
import { computeStats, fmt } from "@/lib/agri/climate";
import { pageHead } from "@/lib/head";
import { Panel, PageHeader } from "@/components/app/Panel";
import { ClimateChart, METRIC_META, type Metric } from "@/components/app/ClimateChart";
import { ErrorState, LoadingState } from "@/components/app/DataState";
import { SourceNote } from "@/components/app/SourceBadge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/climate")({
  head: () => pageHead("Climate Analysis", "Daily temperature, rainfall and solar radiation trends with year-over-year comparisons."),
  component: ClimatePage,
});

const shiftYear = (s: string, n: number) => String(Number(s.slice(0, 4)) + n) + s.slice(4);
const PRESETS = [30, 90, 180, 365];

function ClimatePage() {
  const { farm } = useFarm();
  const [range, setRange] = useState(defaultRange(90));
  const [draft, setDraft] = useState({ start: fmtPowerDate(range.start), end: fmtPowerDate(range.end) });
  const [compare, setCompare] = useState(false);
  const base = { latitude: farm.latitude, longitude: farm.longitude };
  const q = useQuery(climateQuery({ ...base, ...range }));
  const prev = useQuery({ ...climateQuery({ ...base, start: shiftYear(range.start, -1), end: shiftYear(range.end, -1) }), enabled: compare });

  const rows = useMemo(() => {
    if (!q.data) return [];
    return q.data.days.map((d, i) => {
      const p = prev.data?.days[i];
      return { ...d, t2m_cmp: p?.t2m ?? null, precip_cmp: p?.precip ?? null, solar_cmp: p?.solar ?? null };
    });
  }, [q.data, prev.data]);
  const s = q.data ? computeStats(q.data.days) : null;
  const ps = compare && prev.data ? computeStats(prev.data.days) : null;
  const missing = q.data?.days.filter((d) => d.t2m == null || d.precip == null || d.solar == null) ?? [];

  const apply = () => {
    const st = draft.start.replace(/-/g, ""), en = draft.end.replace(/-/g, "");
    if (st && en && st <= en) setRange({ start: st, end: en });
  };
  const preset = (n: number) => { const r = defaultRange(n); setRange(r); setDraft({ start: fmtPowerDate(r.start), end: fmtPowerDate(r.end) }); };
  const maxDate = fmtPowerDate(toPowerDate(new Date()));

  return (
    <div className="space-y-6">
      <PageHeader title="Climate Analysis" description="Explore historical NASA POWER observations for your farm. Drag the slider under each chart to zoom into a period." />
      <Panel>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1"><Label className="text-xs">Start date</Label><Input type="date" max={maxDate} value={draft.start} onChange={(e) => setDraft({ ...draft, start: e.target.value })} /></div>
          <div className="space-y-1"><Label className="text-xs">End date</Label><Input type="date" max={maxDate} value={draft.end} onChange={(e) => setDraft({ ...draft, end: e.target.value })} /></div>
          <Button onClick={apply}>Apply range</Button>
          <div className="flex gap-1">{PRESETS.map((n) => <Button key={n} size="sm" variant="outline" onClick={() => preset(n)}>{n === 365 ? "1 yr" : `${n} d`}</Button>)}</div>
          <label className="ml-auto flex items-center gap-2 text-sm"><Switch checked={compare} onCheckedChange={setCompare} />Compare with previous year</label>
        </div>
      </Panel>

      {q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : q.isLoading ? <LoadingState /> : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              ["Mean temperature", `${fmt(s?.avgTemp)} °C`, ps && `${fmt(ps.avgTemp)} °C last year`],
              ["Total rainfall", `${fmt(s?.totalRain, 0)} mm`, ps && `${fmt(ps.totalRain, 0)} mm last year`],
              ["Mean solar radiation", `${fmt(s?.avgSolar)} kWh/m²`, ps && `${fmt(ps.avgSolar)} kWh/m² last year`],
              ["Days analysed", String(s?.days ?? 0), `${missing.length} with missing values`],
            ].map(([k, v, sub]) => (
              <div key={k} className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{k}</p><p className="mt-1 font-mono text-xl font-semibold">{v}</p>{sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}</div>
            ))}
          </div>
          {compare && prev.isLoading && <p className="text-xs text-muted-foreground">Loading previous-year comparison…</p>}
          {(["t2m", "precip", "solar"] as Metric[]).map((m) => (
            <Panel key={m} title={METRIC_META[m].label} subtitle={`Daily values, ${METRIC_META[m].unit}${compare ? " · dashed/grey = same dates previous year" : ""}`}>
              <ClimateChart data={rows} metric={m} height={260} brush compare={compare && !!prev.data} />
            </Panel>
          ))}
          <Panel title="Missing-data indicators" info="NASA POWER marks unavailable values with -999. They are shown as gaps in the charts and excluded from averages, never filled in.">
            {missing.length === 0 ? (
              <p className="text-sm text-positive-strong">Complete record — no missing values in this range.</p>
            ) : (
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2 text-warning-strong"><AlertCircle className="h-4 w-4" />{missing.length} day(s) contain gaps — typically the most recent days awaiting processing.</p>
                <div className="flex flex-wrap gap-1.5">{missing.slice(0, 40).map((d) => <span key={d.date} className="rounded border border-warning/40 bg-warning/10 px-1.5 py-0.5 font-mono text-[11px]">{d.date}</span>)}</div>
              </div>
            )}
          </Panel>
        </>
      )}
      <SourceNote data={q.data} />
    </div>
  );
}
