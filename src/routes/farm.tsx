import { ClientOnly, createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { MapPin, Satellite } from "lucide-react";
import { useFarm, useFarmClimate } from "@/lib/farm-context";
import { computeStats, fmt } from "@/lib/agri/climate";
import { SOIL_INFO, SOIL_LABELS, type SoilType, type WaterAvailability } from "@/lib/agri/soil";
import { pageHead } from "@/lib/head";
import { Panel, PageHeader } from "@/components/app/Panel";
import { FarmMap } from "@/components/app/FarmMap";
import { InfoTip } from "@/components/app/InfoTip";
import { LoadingState, ErrorState } from "@/components/app/DataState";
import { SourceNote } from "@/components/app/SourceBadge";
import { NASA_GIBS_LAYERS, type GibsLayerType } from "@/lib/nasa/gibs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/farm")({
  head: () => pageHead("Farm Overview", "Select your farm on the map and record soil and crop characteristics."),
  component: FarmPage,
});

const PRESETS = [
  { region: "Nashik, Maharashtra, India", latitude: 19.99, longitude: 73.79 },
  { region: "Ludhiana, Punjab, India", latitude: 30.9, longitude: 75.85 },
  { region: "Anantapur, Andhra Pradesh, India", latitude: 14.68, longitude: 77.6 },
  { region: "Nakuru, Kenya", latitude: -0.3, longitude: 36.07 },
];

function Row({ k, v, info }: { k: string; v: string; info?: string }) {
  return <div className="flex items-center justify-between border-b border-border py-2 text-sm last:border-0"><span className="flex items-center gap-1.5 text-muted-foreground">{k}{info && <InfoTip text={info} />}</span><span className="font-medium">{v}</span></div>;
}

function FarmPage() {
  const { farm, update } = useFarm();
  const q = useFarmClimate();
  const s = useMemo(() => (q.data ? computeStats(q.data.days) : null), [q.data]);
  const [lat, setLat] = useState(String(farm.latitude));
  const [lng, setLng] = useState(String(farm.longitude));
  const [imageryLayer, setImageryLayer] = useState<GibsLayerType | "none">("none");
  const [imageryStatus, setImageryStatus] = useState<"none" | "loading" | "loaded" | "error">("none");
  const soil = SOIL_INFO[farm.soilType];

  const move = (latitude: number, longitude: number, region?: string) => {
    setLat(String(latitude)); setLng(String(longitude));
    update({ latitude, longitude, region: region ?? `Custom location (${latitude.toFixed(2)}, ${longitude.toFixed(2)})` });
  };
  const applyCoords = () => {
    const a = Number(lat), b = Number(lng);
    if (Number.isFinite(a) && Number.isFinite(b) && Math.abs(a) <= 90 && Math.abs(b) <= 180) move(a, b);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Farm Overview" description="Choose your farm's location by clicking the map, entering coordinates or picking a region. All analysis updates automatically." />
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Farm location" subtitle={farm.region} className="lg:col-span-2">
          <ClientOnly fallback={<div className="h-[380px] rounded-lg bg-muted" />}>
            <FarmMap
              lat={farm.latitude}
              lng={farm.longitude}
              height={380}
              onSelect={(a, b) => move(a, b)}
              gibsLayer={imageryLayer === "none" ? null : imageryLayer}
              {...(s?.latestDate ? { gibsDate: s.latestDate } : {})}
              onImageryStatusChange={setImageryStatus}
            />
          </ClientOnly>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs font-medium">
              <Satellite className="h-4 w-4 text-primary" />
              NASA imagery
            </label>
            <Select value={imageryLayer} onValueChange={(value) => setImageryLayer(value as GibsLayerType | "none")}>
              <SelectTrigger className="w-full max-w-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No overlay</SelectItem>
                {Object.values(NASA_GIBS_LAYERS).map((layer) => (
                  <SelectItem key={layer.id} value={layer.id}>{layer.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {imageryLayer === "none" ? "Select an overlay to view NASA GIBS imagery." :
                imageryStatus === "loading" ? "Loading NASA tiles…" :
                  imageryStatus === "loaded" ? `NASA GIBS imagery for ${s?.latestDate ?? "the latest available date"}.` :
                    imageryStatus === "error" ? "NASA GIBS imagery could not be loaded for this date." :
                      "Waiting for the latest observation date…"}
            </p>
            {imageryLayer !== "none" && (
              <p className="basis-full text-xs text-muted-foreground">
                {NASA_GIBS_LAYERS[imageryLayer].description} Tile availability varies by layer and date.
              </p>
            )}
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="space-y-1"><Label htmlFor="lat" className="text-xs">Latitude</Label><Input id="lat" className="w-32 font-mono" value={lat} onChange={(e) => setLat(e.target.value)} /></div>
            <div className="space-y-1"><Label htmlFor="lng" className="text-xs">Longitude</Label><Input id="lng" className="w-32 font-mono" value={lng} onChange={(e) => setLng(e.target.value)} /></div>
            <Button onClick={applyCoords}><MapPin className="mr-1 h-4 w-4" />Set location</Button>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => <Button key={p.region} size="sm" variant="outline" onClick={() => move(p.latitude, p.longitude, p.region)}>{p.region.split(",")[0]}</Button>)}
            </div>
          </div>
        </Panel>
        <Panel title="Environmental conditions" subtitle="90-day NASA POWER summary">
          {q.isLoading ? <LoadingState /> : q.isError ? <ErrorState error={q.error} onRetry={() => q.refetch()} /> : s && (
            <div>
              <Row k="Elevation" v={q.data?.elevation != null ? `${q.data.elevation.toFixed(0)} m` : "—"} />
              <Row k="Mean temperature" v={`${fmt(s.avgTemp)} °C`} info="T2M, 2 m air temperature" />
              <Row k="Total rainfall" v={`${fmt(s.totalRain, 0)} mm`} info="PRECTOTCORR, corrected precipitation" />
              <Row k="Mean solar radiation" v={`${fmt(s.avgSolar)} kWh/m²/day`} info="ALLSKY_SFC_SW_DWN" />
              <Row k="Longest dry spell" v={`${s.longestDrySpell} days`} />
              <Row k="Hot days (>32 °C mean)" v={String(s.hotDays)} />
            </div>
          )}
        </Panel>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Soil characteristics" info="Enter values from your latest soil health card or lab test. These are not satellite measurements.">
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1 sm:col-span-3"><Label className="text-xs">Soil type</Label>
              <Select value={farm.soilType} onValueChange={(v) => update({ soilType: v as SoilType })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.entries(SOIL_LABELS).map(([k, l]) => <SelectItem key={k} value={k}>{l}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Soil pH</Label><Input type="number" step="0.1" min={3} max={10} value={farm.soilPh} onChange={(e) => update({ soilPh: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label className="flex items-center gap-1 text-xs">Organic carbon %<InfoTip text="Below 0.5% is low; 0.5–0.75% medium; above 0.75% good for most Indian soils." /></Label><Input type="number" step="0.05" value={farm.organicCarbonPct} onChange={(e) => update({ organicCarbonPct: Number(e.target.value) })} /></div>
            <div className="space-y-1"><Label className="text-xs">Area (ha)</Label><Input type="number" step="0.1" value={farm.areaHa} onChange={(e) => update({ areaHa: Number(e.target.value) })} /></div>
          </div>
          <div className="mt-4 rounded-lg bg-secondary p-3 text-sm">
            <div className="grid grid-cols-3 gap-2 text-xs"><span>Drainage: <b>{soil.drainage}</b></span><span>Water holding: <b>{soil.waterHolding}</b></span><span>Erosion risk: <b>{soil.erosion}</b></span></div>
            <p className="mt-2 text-xs text-muted-foreground">{soil.note}</p>
          </div>
        </Panel>
        <Panel title="Crop information">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1"><Label className="text-xs">Farm name</Label><Input value={farm.name} onChange={(e) => update({ name: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Current crop</Label><Input value={farm.currentCrop} onChange={(e) => update({ currentCrop: e.target.value })} /></div>
            <div className="space-y-1"><Label className="text-xs">Irrigation method</Label>
              <Select value={farm.irrigation} onValueChange={(v) => update({ irrigation: v })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Rainfed", "Drip", "Sprinkler", "Flood / furrow"].map((x) => <SelectItem key={x} value={x}>{x}</SelectItem>)}</SelectContent></Select>
            </div>
            <div className="space-y-1"><Label className="text-xs">Water availability</Label>
              <Select value={farm.water} onValueChange={(v) => update({ water: v as WaterAvailability })}><SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="low">Low (&lt;400 mm/season)</SelectItem><SelectItem value="medium">Medium (400–700 mm)</SelectItem><SelectItem value="high">High (&gt;700 mm)</SelectItem></SelectContent></Select>
            </div>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Changes are saved in this browser and used across the risk and recommendation pages.</p>
        </Panel>
      </div>
      <SourceNote data={q.data} />
    </div>
  );
}
