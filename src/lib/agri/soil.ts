export type SoilType = "black_cotton" | "red_laterite" | "alluvial" | "sandy_loam" | "clay";
export type WaterAvailability = "low" | "medium" | "high";

export const SOIL_LABELS: Record<SoilType, string> = {
  black_cotton: "Black cotton (Vertisol)",
  red_laterite: "Red / laterite",
  alluvial: "Alluvial",
  sandy_loam: "Sandy loam",
  clay: "Heavy clay",
};

export const SOIL_INFO: Record<SoilType, { drainage: string; waterHolding: string; erosion: "low" | "moderate" | "high"; note: string }> = {
  black_cotton: { drainage: "Poor", waterHolding: "High", erosion: "moderate", note: "Swells when wet, cracks when dry. Retains moisture well; prone to waterlogging." },
  red_laterite: { drainage: "Good", waterHolding: "Low", erosion: "high", note: "Low in nitrogen and organic matter; benefits from mulching and organic inputs." },
  alluvial: { drainage: "Moderate", waterHolding: "Medium", erosion: "low", note: "Fertile and versatile; supports most field and horticultural crops." },
  sandy_loam: { drainage: "Very good", waterHolding: "Low", erosion: "moderate", note: "Warms quickly and drains fast; needs frequent, light irrigation." },
  clay: { drainage: "Poor", waterHolding: "Very high", erosion: "low", note: "Nutrient-rich but compacts easily; avoid tillage when wet." },
};

export interface FarmProfile {
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  areaHa: number;
  soilType: SoilType;
  soilPh: number;
  organicCarbonPct: number;
  water: WaterAvailability;
  currentCrop: string;
  irrigation: string;
}

export const DEFAULT_FARM: FarmProfile = {
  name: "Demo farm — Nashik",
  region: "Nashik, Maharashtra, India",
  latitude: 19.99,
  longitude: 73.79,
  areaHa: 4.5,
  soilType: "black_cotton",
  soilPh: 7.6,
  organicCarbonPct: 0.55,
  water: "medium",
  currentCrop: "Grapes",
  irrigation: "Drip",
};
