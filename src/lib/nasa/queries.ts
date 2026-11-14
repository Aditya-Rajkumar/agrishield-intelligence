import { queryOptions } from "@tanstack/react-query";
import { fetchClimateSeries } from "./power.functions";
import type { ClimateQuery } from "./types";

export const climateQuery = (q: ClimateQuery) =>
  queryOptions({
    queryKey: ["climate", q.latitude.toFixed(2), q.longitude.toFixed(2), q.start, q.end],
    queryFn: () => fetchClimateSeries({ data: q }),
    staleTime: 1000 * 60 * 60,
    retry: 1,
  });

export const toPowerDate = (d: Date) => d.toISOString().slice(0, 10).replace(/-/g, "");

/** NASA POWER daily data typically lags real time by several days. */
export function defaultRange(days = 90) {
  const end = new Date();
  end.setUTCDate(end.getUTCDate() - 7);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return { start: toPowerDate(start), end: toPowerDate(end) };
}

export const fmtPowerDate = (s: string) => `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`;
