import type { DailyObservation } from "../nasa/types";

export interface ClimateStats {
  avgTemp: number | null;
  maxTemp: number | null;
  totalRain: number | null;
  avgSolar: number | null;
  rainyDays: number;
  heavyRainDays: number; // > 50 mm
  hotDays: number; // daily mean > 32 °C
  longestDrySpell: number; // consecutive days < 1 mm
  missing: { t2m: number; precip: number; solar: number };
  days: number;
  latestDate: string | null;
}

const avg = (a: number[]) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : null);

export function computeStats(days: DailyObservation[]): ClimateStats {
  const t = days.map((d) => d.t2m).filter((v): v is number => v != null);
  const p = days.map((d) => d.precip).filter((v): v is number => v != null);
  const s = days.map((d) => d.solar).filter((v): v is number => v != null);
  let dry = 0, longest = 0;
  for (const d of days) {
    if (d.precip != null && d.precip < 1) { dry++; longest = Math.max(longest, dry); }
    else if (d.precip != null) dry = 0;
  }
  const latest = [...days].reverse().find((d) => d.t2m != null || d.precip != null);
  return {
    avgTemp: avg(t),
    maxTemp: t.length ? Math.max(...t) : null,
    totalRain: p.length ? p.reduce((a, b) => a + b, 0) : null,
    avgSolar: avg(s),
    rainyDays: p.filter((v) => v >= 2.5).length,
    heavyRainDays: p.filter((v) => v > 50).length,
    hotDays: t.filter((v) => v > 32).length,
    longestDrySpell: longest,
    missing: {
      t2m: days.length - t.length,
      precip: days.length - p.length,
      solar: days.length - s.length,
    },
    days: days.length,
    latestDate: latest?.date ?? null,
  };
}

/** Weekly aggregation for compact charts. */
export function weekly(days: DailyObservation[]) {
  const out: { date: string; t2m: number | null; precip: number | null; solar: number | null }[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const chunk = days.slice(i, i + 7);
    const st = computeStats(chunk);
    out.push({ date: chunk[0]!.date, t2m: st.avgTemp, precip: st.totalRain, solar: st.avgSolar });
  }
  return out;
}

export const fmt = (v: number | null | undefined, digits = 1) =>
  v == null || Number.isNaN(v) ? "—" : v.toFixed(digits);
