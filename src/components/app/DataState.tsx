import { AlertTriangle, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingState({ label = "Fetching NASA POWER observations…" }: { label?: string }) {
  return <div className="flex h-48 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{label}</div>;
}
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-6 text-center">
      <AlertTriangle className="h-5 w-5 text-destructive" />
      <div>
        <p className="text-sm font-medium text-foreground">Couldn't load climate data</p>
        <p className="mt-1 text-xs text-muted-foreground">{error instanceof Error ? error.message : "The NASA POWER service did not respond."} No substitute data is shown.</p>
      </div>
      {onRetry && <Button size="sm" variant="outline" onClick={onRetry}><RefreshCw className="mr-1 h-3.5 w-3.5" />Retry</Button>}
    </div>
  );
}
