import { createServerFn } from "@tanstack/react-start";
import type { ClimateQuery, ClimateSeries, DailyObservation } from "./types";

const POWER_URL = "https://power.larc.nasa.gov/api/temporal/daily/point";
const FILL = -999;

function clean(v: unknown): number | null {
  return typeof v === "number" && v > FILL + 1 ? v : null;
}

/**
 * Fetches daily NASA POWER observations server-side.
 * If AGRISHIELD_API_URL is set, the Python backend is used instead
 * (expected to return the same ClimateSeries shape from GET /climate).
 */
export const fetchClimateSeries = createServerFn({ method: "GET" })
  .inputValidator((d: ClimateQuery) => {
    const ok = /^\d{8}$/;
    if (!ok.test(d.start) || !ok.test(d.end)) throw new Error("Invalid date range");
    if (Math.abs(d.latitude) > 90 || Math.abs(d.longitude) > 180) throw new Error("Invalid coordinates");
    return d;
  })
  .handler(async ({ data }): Promise<ClimateSeries> => {
    const backend = process.env["AGRISHIELD_API_URL"];
    if (backend) {
      const u = new URL("/climate", backend);
      Object.entries(data).forEach(([k, v]) => u.searchParams.set(k, String(v)));
      const r = await fetch(u);
      if (!r.ok) throw new Error(`Backend responded ${r.status}`);
      return (await r.json()) as ClimateSeries;
    }

    const u = new URL(POWER_URL);
    u.searchParams.set("parameters", "T2M,T2M_MAX,T2M_MIN,RH2M,PRECTOTCORR,ALLSKY_SFC_SW_DWN");
    u.searchParams.set("community", "AG");
    u.searchParams.set("latitude", data.latitude.toFixed(4));
    u.searchParams.set("longitude", data.longitude.toFixed(4));
    u.searchParams.set("start", data.start);
    u.searchParams.set("end", data.end);
    u.searchParams.set("format", "JSON");
    const r = await fetch(u);
    if (!r.ok) throw new Error(`NASA POWER responded ${r.status}`);
    const json = (await r.json()) as {
      geometry?: { coordinates?: number[] };
      properties?: { parameter?: Record<string, Record<string, number>> };
    };
    const p = json.properties?.parameter;
    const T = p?.["T2M"];
    if (!p || !T) throw new Error("NASA POWER returned no data for this location");
    const P = p["PRECTOTCORR"], S = p["ALLSKY_SFC_SW_DWN"];
    const Tmax = p["T2M_MAX"], Tmin = p["T2M_MIN"], RH = p["RH2M"];
    const days: DailyObservation[] = Object.keys(T).map((k) => ({
      date: `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`,
      t2m: clean(T[k]),
      t2mMax: clean(Tmax?.[k]),
      t2mMin: clean(Tmin?.[k]),
      rh2m: clean(RH?.[k]),
      precip: clean(P?.[k]),
      solar: clean(S?.[k]),
    }));
    return {
      latitude: data.latitude,
      longitude: data.longitude,
      elevation: json.geometry?.coordinates?.[2] ?? null,
      start: data.start,
      end: data.end,
      source: "NASA POWER",
      fetchedAt: new Date().toISOString(),
      days,
    };
  });
