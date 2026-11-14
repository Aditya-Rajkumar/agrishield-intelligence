import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/lib/agri/risk";

const styles: Record<RiskLevel, string> = {
  low: "bg-positive/15 text-positive-strong border-positive/30",
  moderate: "bg-warning/15 text-warning-strong border-warning/30",
  high: "bg-destructive/10 text-destructive border-destructive/30",
};
export function RiskBadge({ level }: { level: RiskLevel }) {
  return <span className={cn("inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", styles[level])}>{level}</span>;
}
export const riskBar: Record<RiskLevel, string> = { low: "bg-positive", moderate: "bg-warning", high: "bg-destructive" };
