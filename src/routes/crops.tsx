import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Droplets, Leaf } from "lucide-react";
import { useFarm, useFarmClimate } from "@/lib/farm-context";
import { computeStats } from "@/lib/agri/climate";
import { CROPS, PRIORITY_LABELS, buildRotations, scoreCrop, type Priority } from "@/lib/agri/recommend";
import { SOIL_LABELS, type SoilType, type WaterAvailability } from "@/lib/agri/soil";
import { pageHead } from "@/lib/head";
import { Panel, PageHeader } from "@/components/app/Panel";
import { ErrorState, LoadingState } from "@/components/app/DataState";
import { SourceNote } from "@/components/app/SourceBadge";
import { generateYieldAndRiskForecast, type DailyMeteoRecord } from "@/lib/agri/yield-forecast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/crops")({
  head: () => pageHead("Crop Recommendations", "Compare crop rotation strategies matched to your soil, water and observed climate."),
  component: CropsPage,
});

function Score({ label, v }: { label: string; v: number }) {
  return (
    <div>
      <div className="flex justify-between text-[11px] text-muted-foreground"><span>{label}</span><span className="font-mono">{v}</span></div>
      <div className="mt-1 h-1.5 rounded-full bg-muted"><div className={cn("h-full rounded-full", v >= 70 ? "bg-positive" : v >= 40 ? "bg-warning" : "bg-destructive")} style={{ width: `${v}%` }} /></div>
    </div>
  );
}

function YieldEstimatePanel({ days, cropName }: { days: NonNullable<ReturnType<typeof useFarmClimate>["data"]>["days"]; cropName: string }) {
  const [baseTemp, setBaseTemp] = useState("");
  const [optimalGDD, setOptimalGDD] = useState("");
  const [potentialYield, setPotentialYield] = useState("");
  const records = useMemo<DailyMeteoRecord[]>(
    () => days.flatMap((day) => (
      day.t2mMax != null && day.t2mMin != null && day.rh2m != null && day.precip != null
        ? [{ date: day.date, tMax: day.t2mMax, tMin: day.t2mMin, rh: day.rh2m, precip: day.precip }]
        : []
    )),
    [days],
  );
  const config = useMemo(() => {
    if ([baseTemp, optimalGDD, potentialYield].some((value) => value.trim() === "" || !Number.isFinite(Number(value)))) return null;
    const parsedBaseTemp = Number(baseTemp);
    const parsedOptimalGDD = Number(optimalGDD);
    const parsedPotentialYield = Number(potentialYield);
    if (parsedOptimalGDD <= 0 || parsedPotentialYield <= 0) return null;
    return { baseTemp: parsedBaseTemp, optimalGDD: parsedOptimalGDD, potentialYield: parsedPotentialYield };
  }, [baseTemp, optimalGDD, potentialYield]);
  const report = useMemo(
    () => config && records.length > 0 ? generateYieldAndRiskForecast(records, config) : null,
    [config, records],
  );

  return (
    <Panel title={`Experimental yield screening · ${cropName || "current crop"}`} subtitle="Uses complete NASA POWER daily observations from the current 90-day window">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="yield-base-temp" className="text-xs">Crop base temperature (°C)</Label>
            <Input id="yield-base-temp" type="number" step="0.5" value={baseTemp} onChange={(e) => setBaseTemp(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="yield-optimal-gdd" className="text-xs">Target GDD</Label>
            <Input id="yield-optimal-gdd" type="number" min="1" step="50" value={optimalGDD} onChange={(e) => setOptimalGDD(e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="yield-potential" className="text-xs">Potential yield (t/ha)</Label>
            <Input id="yield-potential" type="number" min="0.1" step="0.1" value={potentialYield} onChange={(e) => setPotentialYield(e.target.value)} />
          </div>
          <p className="text-xs text-muted-foreground sm:col-span-3">
            Enter values for the crop and cultivar from a trusted local source. Only complete days with maximum/minimum temperature, humidity, and rainfall are used ({records.length} available).
          </p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/50 p-4" aria-live="polite">
          {report ? (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Climate-screening estimate</p>
              <p className="mt-1 font-mono text-3xl font-semibold">{report.predictedYieldTonnesPerHa} <span className="text-sm font-normal text-muted-foreground">t/ha</span></p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <p>Accumulated GDD <b className="font-mono">{report.accumulatedGDD}</b></p>
                <p>Mean VPD <b className="font-mono">{report.meanVPD} kPa</b></p>
                <p className="col-span-2">Extreme events flagged <b className="font-mono">{report.extremeEvents.length}</b></p>
              </div>
              {report.extremeEvents.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
                  {report.extremeEvents.slice(0, 4).map((event, index) => (
                    <li key={`${event.type}-${event.startDate}-${index}`}>
                      <b>{event.severity} {event.type}</b> · {event.startDate}: {event.details}
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No complete NASA POWER temperature, humidity, and rainfall records are available for this window; an estimate cannot be calculated.</p>
          ) : (
            <p className="text-sm text-muted-foreground">Enter the crop-specific values to calculate a screening estimate.</p>
          )}
        </div>
      </div>
      <p className="mt-3 text-xs text-warning-strong">
        This experimental screening formula is not a validated yield model or a full-season forecast. It excludes cultivar, soil, pests, and farm management; do not use it as a guaranteed production estimate.
      </p>
    </Panel>
  );
}

function CropsPage() {
  const { farm, update } = useFarm();
  const q = useFarmClimate();
  const [priorities, setPriorities] = useState<Priority[]>(["water", "soil"]);
  const stats = useMemo(() => (q.data ? computeStats(q.data.days) : null), [q.data]);
  const input = { soilType: farm.soilType, soilPh: farm.soilPh, water: farm.water, currentCrop: farm.currentCrop, priorities };
  const rotations = useMemo(() => (stats ? buildRotations(input, stats) : []), [stats, JSON.stringify(input)]); // eslint-disable-line react-hooks/exhaustive-deps
  const singles = useMemo(() => (stats ? CROPS.filter((c) => c.season !== "Perennial").map((c) => scoreCrop(c, input, stats)).sort((a, b) => b.total - a.total).slice(0, 5) : []), [stats, JSON.stringify(input)]); // eslint-disable-line react-hooks/exhaustive-deps
  const top3 = rotations.slice(0, 3);

  return (
    <div className="space-y-6">
      <PageHeader title="Crop Recommendations" description="Suitability scores combine observed NASA POWER climate with your soil and water inputs." />
      <div className="flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs text-warning-strong">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        Decision-support only. Scores are rule-based screening estimates from recent observations, not validated yield predictions. Confirm with your local agricultural extension officer before planting.
      </div>
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <Panel title="Your inputs">
          <div className="space-y-3">
            <div className="space-y-1"><Label className="text-xs">Farm location</Label><Input value={farm.region} readOnly className="bg-muted" /></div>
            <div className="space-y-1"><Label className="text-xs">Soil type</Label>
              <Select value={farm.soilType} onValueChange={(v) => update({ soilType: v as SoilType })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SOIL_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Soil pH</Label><Input type="number" step="0.1" value={farm.soilPh} onChange={(e) => update({ soilPh: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label className="text-xs">Available water</Label>
              <Select value={farm.water} onValueChange={(v) => update({ water: v as WaterAvailability })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low (&lt;400 mm/season)</SelectItem><SelectItem value="medium">Medium (400–700 mm)</SelectItem><SelectItem value="high">High (&gt;700 mm)</SelectItem></SelectContent></Select></div>
            <div className="space-y-1"><Label className="text-xs">Current crop</Label><Input value={farm.currentCrop} onChange={(e) => update({ currentCrop: e.target.value })} /></div>
            <div className="space-y-2"><Label className="text-xs">Farming priorities</Label>
              {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                <label key={p} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={priorities.includes(p)} onCheckedChange={(c) => setPriorities((x) => (c ? [...x, p] : x.filter((y) => y !== p)))} />{PRIORITY_LABELS[p]}
                </label>
              ))}
            </div>
          </div>
        </Panel>

        <div className="space-y-4">
          {q.isLoading ? <Panel><LoadingState label="Loading climate data for scoring…" /></Panel> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : (
            <>
              <Panel title="Rotation strategy comparison" subtitle="Top three of four strategies, ranked for your inputs">
                <div className="grid gap-3 md:grid-cols-3">
                  {top3.map((r, i) => (
                    <div key={r.id} className={cn("rounded-lg border p-4", i === 0 ? "border-positive bg-positive/5" : "border-border")}>
                      <div className="flex items-center justify-between"><p className="text-sm font-semibold">{r.name}</p>{i === 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold text-primary-foreground">Best fit</span>}</div>
                      <p className="mt-1 text-xs text-muted-foreground">{r.strategy}</p>
                      <p className="mt-3 font-mono text-3xl font-semibold">{r.avg}<span className="text-sm text-muted-foreground">/100</span></p>
                      <ol className="mt-3 space-y-1 text-xs">{r.steps.map((s) => <li key={s.crop.name} className="flex justify-between"><span>{s.crop.season}: <b>{s.crop.name}</b></span><span className="font-mono text-muted-foreground">{s.total}</span></li>)}</ol>
                      <div className="mt-3 flex gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Droplets className="h-3 w-3" />{r.waterMm} mm/yr</span>
                        <span className="flex items-center gap-1"><Leaf className="h-3 w-3" />{r.legumes} legume{r.legumes !== 1 && "s"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>
              {q.data && <YieldEstimatePanel days={q.data.days} cropName={farm.currentCrop} />}
              <Panel title="Why these crops" subtitle="Highest-scoring individual crops and the reasoning behind each">
                <div className="space-y-3">
                  {singles.map((c) => (
                    <div key={c.crop.name} className="grid gap-4 rounded-lg border border-border p-4 md:grid-cols-[1fr_220px]">
                      <div>
                        <p className="text-sm font-semibold">{c.crop.name} <span className="ml-1 text-xs font-normal text-muted-foreground">{c.crop.season} · ~{c.crop.waterMm} mm water/season</span></p>
                        <ul className="mt-2 space-y-1 text-xs">
                          {c.reasons.map((r) => <li key={r} className="flex gap-1.5"><CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-positive-strong" />{r}</li>)}
                          {c.risks.map((r) => <li key={r} className="flex gap-1.5 text-warning-strong"><AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />{r}</li>)}
                        </ul>
                      </div>
                      <div className="space-y-2"><Score label="Climate compatibility" v={c.climate} /><Score label="Soil compatibility" v={c.soil} /><Score label="Water fit" v={c.water} /></div>
                    </div>
                  ))}
                </div>
              </Panel>
            </>
          )}
        </div>
      </div>
      <SourceNote data={q.data} />
    </div>
  );
}
