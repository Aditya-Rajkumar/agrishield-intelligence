import { Area, AreaChart, Bar, BarChart, Brush, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export type Metric = "t2m" | "precip" | "solar";
export const METRIC_META: Record<Metric, { label: string; unit: string; color: string }> = {
  t2m: { label: "Temperature (T2M)", unit: "°C", color: "var(--chart-temp)" },
  precip: { label: "Precipitation (PRECTOTCORR)", unit: "mm/day", color: "var(--chart-rain)" },
  solar: { label: "Solar radiation (ALLSKY_SFC_SW_DWN)", unit: "kWh/m²/day", color: "var(--chart-sun)" },
};

type Row = { date: string } & Partial<Record<Metric | `${Metric}_cmp`, number | null>>;

export function ClimateChart({ data, metric, height = 220, brush, compare }: { data: Row[]; metric: Metric; height?: number; brush?: boolean; compare?: boolean }) {
  const m = METRIC_META[metric];
  const common = (
    <>
      <CartesianGrid stroke="var(--border)" vertical={false} />
      <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} tickFormatter={(d: string) => d.slice(5)} minTickGap={24} axisLine={false} tickLine={false} />
      <YAxis tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} width={36} axisLine={false} tickLine={false} />
      <Tooltip
        contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
        formatter={(v: unknown, name: unknown) => [typeof v !== "number" ? "Missing" : `${v.toFixed(2)} ${m.unit}`, String(name).endsWith("_cmp") ? "Previous year" : m.label.split(" (")[0]]}
      />
      {brush && <Brush dataKey="date" height={20} stroke="var(--primary)" travellerWidth={8} tickFormatter={(d: string) => d.slice(5)} />}
    </>
  );
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {metric === "precip" ? (
          <BarChart data={data}>{common}
            {compare && <Bar dataKey="precip_cmp" fill="var(--muted-foreground)" opacity={0.35} radius={[2, 2, 0, 0]} />}
            <Bar dataKey="precip" fill={m.color} radius={[2, 2, 0, 0]} />
          </BarChart>
        ) : compare ? (
          <LineChart data={data}>{common}
            <Line dataKey={`${metric}_cmp`} stroke="var(--muted-foreground)" strokeDasharray="4 3" dot={false} strokeWidth={1.5} connectNulls={false} />
            <Line dataKey={metric} stroke={m.color} dot={false} strokeWidth={2} connectNulls={false} />
          </LineChart>
        ) : (
          <AreaChart data={data}>{common}
            <defs><linearGradient id={`g-${metric}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor={m.color} stopOpacity={0.25} /><stop offset="100%" stopColor={m.color} stopOpacity={0} /></linearGradient></defs>
            <Area dataKey={metric} stroke={m.color} fill={`url(#g-${metric})`} strokeWidth={2} dot={false} connectNulls={false} />
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
