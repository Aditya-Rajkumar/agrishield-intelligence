import type { ClimateStats } from "./climate";
import { SOIL_INFO, type FarmProfile } from "./soil";

export type RiskLevel = "low" | "moderate" | "high";

export interface RiskAssessment {
  id: "drought" | "excess_rain" | "heat" | "water" | "soil";
  label: string;
  level: RiskLevel;
  score: number; // 0-100
  evidence: string[];
  action: string;
}

const level = (s: number): RiskLevel => (s >= 65 ? "high" : s >= 35 ? "moderate" : "low");
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

/**
 * Rule-based indicators derived from observed NASA POWER data and the farm profile.
 * These are screening heuristics, not validated forecasts.
 */
export function assessRisks(s: ClimateStats, farm: FarmProfile): RiskAssessment[] {
  const rainPerDay = s.totalRain != null && s.days ? s.totalRain / s.days : 0;
  const soil = SOIL_INFO[farm.soilType];

  const drought = clamp(s.longestDrySpell * 2.2 + (rainPerDay < 1 ? 25 : rainPerDay < 3 ? 10 : 0) + (farm.water === "low" ? 15 : 0));
  const excess = clamp(s.heavyRainDays * 22 + (rainPerDay > 10 ? 30 : rainPerDay > 6 ? 15 : 0) + (soil.drainage === "Poor" ? 12 : 0));
  const heat = clamp((s.hotDays / Math.max(1, s.days)) * 220 + ((s.maxTemp ?? 0) > 34 ? 25 : (s.maxTemp ?? 0) > 30 ? 10 : 0));
  const water = clamp((farm.water === "low" ? 50 : farm.water === "medium" ? 25 : 5) + (rainPerDay < 2 ? 20 : 0) + ((s.avgSolar ?? 0) > 22 ? 10 : 0) + (soil.waterHolding === "Low" ? 10 : 0));
  const soilScore = clamp((farm.organicCarbonPct < 0.5 ? 35 : farm.organicCarbonPct < 0.75 ? 18 : 5) + (soil.erosion === "high" ? 25 : soil.erosion === "moderate" ? 12 : 0) + s.heavyRainDays * 8 + (farm.soilPh > 8.2 || farm.soilPh < 5.8 ? 20 : 0));

  return [
    { id: "drought", label: "Drought risk", score: drought, level: level(drought),
      evidence: [`Longest dry spell: ${s.longestDrySpell} days (<1 mm/day)`, `Mean rainfall: ${rainPerDay.toFixed(1)} mm/day over ${s.days} days`, `Water availability: ${farm.water}`],
      action: "Prioritise mulching, deficit irrigation scheduling and drought-tolerant varieties." },
    { id: "excess_rain", label: "Excessive rainfall", score: excess, level: level(excess),
      evidence: [`Heavy-rain days (>50 mm): ${s.heavyRainDays}`, `Mean rainfall: ${rainPerDay.toFixed(1)} mm/day`, `Soil drainage: ${soil.drainage}`],
      action: "Maintain field drains and raised beds; monitor fungal disease after wet spells." },
    { id: "heat", label: "Heat stress", score: heat, level: level(heat),
      evidence: [`Days with mean temperature >32 °C: ${s.hotDays}`, `Highest daily mean: ${s.maxTemp?.toFixed(1) ?? "—"} °C`],
      action: "Shift sowing windows, irrigate in early morning and consider shade nets for sensitive crops." },
    { id: "water", label: "Water availability", score: water, level: level(water),
      evidence: [`Reported water availability: ${farm.water}`, `Mean solar radiation: ${s.avgSolar?.toFixed(1) ?? "—"} kWh/m²/day (drives evaporation)`, `Soil water-holding: ${soil.waterHolding}`],
      action: "Adopt drip irrigation, farm ponds or rainwater harvesting; favour lower-water crops." },
    { id: "soil", label: "Soil degradation", score: soilScore, level: level(soilScore),
      evidence: [`Organic carbon: ${farm.organicCarbonPct}%`, `Soil pH: ${farm.soilPh}`, `Erosion susceptibility: ${soil.erosion}`, `Heavy-rain days: ${s.heavyRainDays}`],
      action: "Add legumes and cover crops, incorporate residues and reduce tillage." },
  ];
}
