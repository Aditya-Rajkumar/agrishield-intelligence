import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { InfoTip } from "./InfoTip";

export function MetricCard({ icon: Icon, label, value, unit, sub, info, loading }: {
  icon: LucideIcon; label: string; value: string; unit: string; sub?: string | undefined; info: string; loading?: boolean;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}<InfoTip text={info} /></span>
        <span className="rounded-md bg-secondary p-1.5 text-primary"><Icon className="h-4 w-4" /></span>
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-28" /> : (
        <p className="mt-3 font-mono text-3xl font-semibold tracking-tight text-foreground">
          {value}<span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>
        </p>
      )}
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
