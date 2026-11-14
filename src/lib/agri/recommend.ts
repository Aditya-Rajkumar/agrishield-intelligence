import type { ClimateStats } from "./climate";
import type { SoilType, WaterAvailability } from "./soil";

export interface Crop {
  name: string;
  season: "Kharif" | "Rabi" | "Zaid" | "Perennial";
  tempMin: number; tempMax: number; // optimal mean °C
  waterMm: number; // seasonal requirement
  phMin: number; phMax: number;
  soils: SoilType[];
  legume?: boolean;
}

export const CROPS: Crop[] = [
  { name: "Soybean", season: "Kharif", tempMin: 20, tempMax: 30, waterMm: 450, phMin: 6, phMax: 7.5, soils: ["black_cotton", "alluvial", "clay"], legume: true },
  { name: "Pigeon pea (Tur)", season: "Kharif", tempMin: 20, tempMax: 32, waterMm: 400, phMin: 6, phMax: 8, soils: ["black_cotton", "red_laterite", "alluvial", "sandy_loam"], legume: true },
  { name: "Pearl millet (Bajra)", season: "Kharif", tempMin: 24, tempMax: 34, waterMm: 300, phMin: 6, phMax: 8.5, soils: ["sandy_loam", "red_laterite", "alluvial", "black_cotton"] },
  { name: "Cotton", season: "Kharif", tempMin: 21, tempMax: 32, waterMm: 700, phMin: 6, phMax: 8.2, soils: ["black_cotton", "alluvial"] },
  { name: "Rice", season: "Kharif", tempMin: 22, tempMax: 32, waterMm: 1200, phMin: 5.5, phMax: 7, soils: ["clay", "alluvial"] },
  { name: "Wheat", season: "Rabi", tempMin: 15, tempMax: 25, waterMm: 450, phMin: 6, phMax: 7.8, soils: ["alluvial", "black_cotton", "clay"] },
  { name: "Chickpea (Gram)", season: "Rabi", tempMin: 15, tempMax: 27, waterMm: 300, phMin: 6, phMax: 8, soils: ["black_cotton", "alluvial", "sandy_loam"], legume: true },
  { name: "Sorghum (Jowar)", season: "Rabi", tempMin: 20, tempMax: 32, waterMm: 400, phMin: 6, phMax: 8.5, soils: ["black_cotton", "red_laterite", "alluvial"] },
  { name: "Onion", season: "Rabi", tempMin: 13, tempMax: 28, waterMm: 500, phMin: 6, phMax: 7.5, soils: ["alluvial", "sandy_loam", "black_cotton"] },
  { name: "Green gram (Moong)", season: "Zaid", tempMin: 25, tempMax: 35, waterMm: 250, phMin: 6.2, phMax: 7.5, soils: ["sandy_loam", "alluvial", "red_laterite"], legume: true },
  { name: "Groundnut", season: "Zaid", tempMin: 22, tempMax: 32, waterMm: 500, phMin: 6, phMax: 7.5, soils: ["sandy_loam", "red_laterite", "alluvial"], legume: true },
  { name: "Grapes", season: "Perennial", tempMin: 15, tempMax: 35, waterMm: 900, phMin: 6.5, phMax: 8, soils: ["black_cotton", "red_laterite", "sandy_loam"] },
];

export type Priority = "water" | "income" | "soil" | "resilience";
export const PRIORITY_LABELS: Record<Priority, string> = {
  water: "Save water", income: "Maximise income", soil: "Improve soil health", resilience: "Climate resilience",
};

export interface RecInput {
  soilType: SoilType; soilPh: number; water: WaterAvailability; currentCrop: string; priorities: Priority[];
}

const WATER_BUDGET: Record<WaterAvailability, number> = { low: 400, medium: 700, high: 1200 };

export interface CropFit {
  crop: Crop; climate: number; soil: number; water: number; total: number; reasons: string[]; risks: string[];
}

export function scoreCrop(c: Crop, inp: RecInput, s: ClimateStats): CropFit {
  const t = s.avgTemp ?? 25;
  const mid = (c.tempMin + c.tempMax) / 2, half = (c.tempMax - c.tempMin) / 2;
  const climate = t >= c.tempMin && t <= c.tempMax ? 100 - (Math.abs(t - mid) / half) * 20 : Math.max(0, 100 - Math.min(Math.abs(t - c.tempMin), Math.abs(t - c.tempMax)) * 15);
  const phOk = inp.soilPh >= c.phMin && inp.soilPh <= c.phMax;
  const soil = (c.soils.includes(inp.soilType) ? 60 : 20) + (phOk ? 40 : Math.max(0, 40 - Math.min(Math.abs(inp.soilPh - c.phMin), Math.abs(inp.soilPh - c.phMax)) * 30));
  const budget = WATER_BUDGET[inp.water];
  const water = c.waterMm <= budget ? 100 - (c.waterMm / budget) * 35 : Math.max(0, 100 - ((c.waterMm - budget) / budget) * 120);
  const reasons: string[] = [];
  const risks: string[] = [];
  reasons.push(climate >= 80 ? `Observed mean ${t.toFixed(1)} °C is within its ${c.tempMin}–${c.tempMax} °C optimum` : `Observed mean ${t.toFixed(1)} °C is outside its ${c.tempMin}–${c.tempMax} °C optimum`);
  if (c.soils.includes(inp.soilType)) reasons.push("Well suited to your soil type");
  if (phOk) reasons.push(`Tolerates soil pH ${inp.soilPh}`); else risks.push(`pH ${inp.soilPh} outside ${c.phMin}–${c.phMax} range`);
  if (c.legume) reasons.push("Legume — fixes atmospheric nitrogen");
  if (water < 70) risks.push(`Needs ~${c.waterMm} mm per season; exceeds typical ${inp.water}-water budget`);
  if ((s.hotDays ?? 0) > 5 && c.tempMax < 30) risks.push("Recent hot days may cause heat stress");
  if (c.name.toLowerCase().startsWith(inp.currentCrop.toLowerCase().split(" ")[0] ?? "")) risks.push("Same as current crop — monoculture raises pest and nutrient risks");
  let w = { climate: 0.35, soil: 0.3, water: 0.35 };
  if (inp.priorities.includes("water")) w = { climate: 0.25, soil: 0.25, water: 0.5 };
  let total = climate * w.climate + soil * w.soil + water * w.water;
  if (inp.priorities.includes("soil") && c.legume) total += 8;
  if (inp.priorities.includes("resilience") && c.waterMm <= 400) total += 6;
  if (inp.priorities.includes("income") && ["Cotton", "Onion", "Grapes", "Soybean"].includes(c.name)) total += 6;
  return { crop: c, climate: Math.round(climate), soil: Math.round(soil), water: Math.round(water), total: Math.min(100, Math.round(total)), reasons, risks };
}

export interface Rotation {
  id: string; name: string; strategy: string; steps: CropFit[]; avg: number; waterMm: number; legumes: number;
}

const ROTATIONS: { id: string; name: string; strategy: string; crops: string[] }[] = [
  { id: "water", name: "Water-saving", strategy: "Low-water cereals and pulses for limited irrigation", crops: ["Pearl millet (Bajra)", "Chickpea (Gram)", "Green gram (Moong)"] },
  { id: "soil", name: "Soil-restorative", strategy: "Legume-heavy cycle to rebuild nitrogen and organic matter", crops: ["Soybean", "Chickpea (Gram)", "Green gram (Moong)"] },
  { id: "market", name: "Market-oriented", strategy: "Higher-value cash crops with a pulse break", crops: ["Cotton", "Onion", "Groundnut"] },
  { id: "balanced", name: "Balanced cereal–pulse", strategy: "Diversified sorghum, wheat and pigeon pea system", crops: ["Pigeon pea (Tur)", "Wheat", "Green gram (Moong)"] },
];

export function buildRotations(inp: RecInput, s: ClimateStats): Rotation[] {
  return ROTATIONS.map((r) => {
    const steps = r.crops.map((n) => scoreCrop(CROPS.find((c) => c.name === n)!, inp, s));
    return {
      id: r.id, name: r.name, strategy: r.strategy, steps,
      waterMm: steps.reduce((a, b) => a + b.crop.waterMm, 0),
      avg: Math.max(0, Math.round(steps.reduce((a, b) => a + b.total, 0) / steps.length - (inp.priorities.includes("water") ? steps.reduce((a, b) => a + b.crop.waterMm, 0) / 100 : 0))),
      legumes: steps.filter((x) => x.crop.legume).length,
    };
  }).sort((a, b) => b.avg - a.avg);
}
