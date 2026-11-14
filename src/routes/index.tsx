import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CloudRain, Database, Sun, Thermometer } from "lucide-react";
import { useMemo } from "react";
import { useFarm, useFarmClimate } from "@/lib/farm-context";
import { computeStats, fmt } from "@/lib/agri/climate";
import { assessRisks } from "@/lib/agri/risk";
import { pageHead } from "@/lib/head";
import { MetricCard } from "@/components/app/MetricCard";
import { Panel } from "@/components/app/Panel";
import { ClimateChart } from "@/components/app/ClimateChart";
import { FarmMap } from "@/components/app/FarmMap";
import { RiskBadge, riskBar } from "@/components/app/RiskBadge";
import { ErrorState, LoadingState } from "@/components/app/DataState";
import { SourceNote } from "@/components/app/SourceBadge";
import { AlertCenter } from "@/components/app/AlertCenter";
import { generateObservationAlerts } from "@/lib/agri/advisory-alerts";
import { ClientOnly } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => pageHead("Dashboard", "Farm climate overview from NASA POWER: temperature, rainfall, solar radiation and agricultural risk."),
  component: Dashboard,
});

function Dashboard() {
  const { farm, update } = useFarm();
  const q = useFarmClimate();
  const stats = useMemo(() => (q.data ? computeStats(q.data.days) : null), [q.data]);
  const risks = useMemo(() => (stats ? assessRisks(stats, farm) : []), [stats, farm]);
  const alerts = useMemo(() => (q.data ? generateObservationAlerts(q.data.days) : []), [q.data]);
  const latest = q.data && stats?.latestDate ? q.data.days.find((d) => d.date === stats.latestDate) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-widest text-positive-strong">Farm dashboard</p>
          <h1 className="mt-1 text-xl font-semibold tracking-tight">Welcome back — here's how {farm.region.split(",")[0]} is tracking</h1>
          <p className="mt-1 text-sm text-muted-foreground">Last 90 days of satellite-derived observations for {farm.name}.</p>
        </div>
        {latest && (
          <div className="rounded-lg border border-border bg-card px-4 py-2.5 text-xs">
            <p className="text-muted-foreground">Latest observation · <span className="font-mono">{latest.date}</span></p>
            <p className="mt-0.5 font-mono font-medium">{fmt(latest.t2m)} °C · {fmt(latest.precip)} mm · {fmt(latest.solar)} kWh/m²</p>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard icon={Thermometer} label="Avg temperature" value={fmt(stats?.avgTemp)} unit="°C" loading={q.isLoading}
          sub={stats ? `Peak daily mean ${fmt(stats.maxTemp)} °C` : undefined}
          info="T2M: mean air temperature at 2 metres above the ground, averaged over each day." />
        <MetricCard icon={CloudRain} label="Total rainfall" value={fmt(stats?.totalRain, 0)} unit="mm" loading={q.isLoading}
          sub={stats ? `${stats.rainyDays} rainy days (≥2.5 mm)` : undefined}
          info="PRECTOTCORR: bias-corrected total precipitation at the surface, summed over the period." />
        <MetricCard icon={Sun} label="Avg solar radiation" value={fmt(stats?.avgSolar)} unit="kWh/m²/day" loading={q.isLoading}
          sub="Drives photosynthesis and evaporation"
          info="ALLSKY_SFC_SW_DWN: total sunlight energy reaching the ground under actual cloud conditions." />
      </div>

      {q.isError && <ErrorState error={q.error} onRetry={() => q.refetch()} />}

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Temperature trend" subtitle="Daily mean, °C" className="lg:col-span-2" action={<Link to="/climate" className="flex items-center gap-1 text-xs font-medium text-positive-strong hover:underline">Full analysis <ArrowRight className="h-3 w-3" /></Link>}>
          {q.isLoading ? <LoadingState /> : q.data && <ClimateChart data={q.data.days} metric="t2m" />}
        </Panel>
        <Panel title="Agricultural risk summary" info="Rule-based screening indicators from observed data and your farm profile. Not a forecast.">
          {q.isLoading ? <LoadingState label="Assessing…" /> : (
            <ul className="space-y-3">
              {risks.map((r) => (
                <li key={r.id}>
                  <div className="flex items-center justify-between text-sm"><span>{r.label}</span><RiskBadge level={r.level} /></div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted"><div className={`h-full rounded-full ${riskBar[r.level]}`} style={{ width: `${r.score}%` }} /></div>
                </li>
              ))}
              <Link to="/risk" className="flex items-center gap-1 pt-1 text-xs font-medium text-positive-strong hover:underline">See evidence <ArrowRight className="h-3 w-3" /></Link>
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Recent observation alerts" subtitle="Last seven available NASA POWER daily observations">
        {q.isLoading ? <LoadingState label="Checking recent observations…" /> : q.data && <AlertCenter alerts={alerts} />}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Rainfall" subtitle="Daily precipitation, mm/day">
          {q.isLoading ? <LoadingState /> : q.data && <ClimateChart data={q.data.days} metric="precip" height={200} />}
        </Panel>
        <Panel title="Solar radiation" subtitle="All-sky surface shortwave, kWh/m²/day">
          {q.isLoading ? <LoadingState /> : q.data && <ClimateChart data={q.data.days} metric="solar" height={200} />}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Farm location" subtitle="Click the map to move your farm" className="lg:col-span-2">
          <ClientOnly fallback={<div className="h-[280px] rounded-lg bg-muted" />}>
            <FarmMap lat={farm.latitude} lng={farm.longitude} height={280} onSelect={(latitude, longitude) => update({ latitude, longitude, region: `Custom location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})` })} />
          </ClientOnly>
        </Panel>
        <Panel title="Recent data updates">
          <ul className="space-y-3 text-sm">
            <li className="flex gap-3"><Database className="mt-0.5 h-4 w-4 text-positive-strong" /><div><p className="font-medium">{q.data ? `${q.data.days.length} daily records loaded` : "Loading records…"}</p><p className="text-xs text-muted-foreground">{q.data ? `Retrieved ${new Date(q.data.fetchedAt).toLocaleString()}` : "NASA POWER daily API"}</p></div></li>
            <li className="flex gap-3"><Database className="mt-0.5 h-4 w-4 text-positive-strong" /><div><p className="font-medium">Latest observed day: <span className="font-mono">{stats?.latestDate ?? "—"}</span></p><p className="text-xs text-muted-foreground">NASA POWER typically lags real time by several days</p></div></li>
            <li className="flex gap-3"><Database className="mt-0.5 h-4 w-4 text-warning-strong" /><div><p className="font-medium">Missing values</p><p className="text-xs text-muted-foreground">{stats ? `Temp ${stats.missing.t2m} · Rain ${stats.missing.precip} · Solar ${stats.missing.solar} days` : "—"}</p></div></li>
          </ul>
        </Panel>
      </div>
      <SourceNote data={q.data} />
    </div>
  );
}
