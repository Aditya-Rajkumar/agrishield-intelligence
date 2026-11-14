export interface DailyObservation {
  date: string; // YYYY-MM-DD
  t2m: number | null; // °C
  t2mMax?: number | null; // °C
  t2mMin?: number | null; // °C
  rh2m?: number | null; // %
  precip: number | null; // mm/day
  solar: number | null; // kWh/m²/day
}

export interface ClimateSeries {
  latitude: number;
  longitude: number;
  elevation: number | null;
  start: string;
  end: string;
  source: "NASA POWER" | "AgriShield backend";
  fetchedAt: string;
  days: DailyObservation[];
}

export interface ClimateQuery {
  latitude: number;
  longitude: number;
  start: string; // YYYYMMDD
  end: string; // YYYYMMDD
}
