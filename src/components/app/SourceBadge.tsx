import { Satellite } from "lucide-react";
import type { ClimateSeries } from "@/lib/nasa/types";
import { fmtPowerDate } from "@/lib/nasa/queries";

export function SourceNote({ data }: { data?: ClimateSeries | undefined }) {
  if (!data) return null;
  return (
    <p className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
      <Satellite className="h-3 w-3" />
      Source: {data.source} daily point data (historical observations, not a forecast) · {fmtPowerDate(data.start)} → {fmtPowerDate(data.end)} · retrieved {new Date(data.fetchedAt).toLocaleString()}
    </p>
  );
}
