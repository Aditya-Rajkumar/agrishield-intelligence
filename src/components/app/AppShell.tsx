import { Link, useRouterState } from "@tanstack/react-router";
import { BarChart3, LayoutDashboard, MapPin, Menu, ShieldAlert, Sprout, Satellite, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { useFarm, useFarmClimate } from "@/lib/farm-context";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/farm", label: "Farm Overview", icon: MapPin },
  { to: "/climate", label: "Climate Analysis", icon: BarChart3 },
  { to: "/crops", label: "Crop Recommendations", icon: Sprout },
  { to: "/risk", label: "Risk Analysis", icon: ShieldAlert },
] as const;

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-8 w-8 place-items-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"><Sprout className="h-4 w-4" /></div>
      <div className="leading-tight"><p className="text-sm font-semibold">AgriShield AI</p><p className="text-[10px] uppercase tracking-widest text-sidebar-foreground/60">Climate intelligence</p></div>
    </div>
  );
}

function DataStatus() {
  const q = useFarmClimate();
  const state = q.isLoading ? { c: "bg-warning", t: "Connecting to NASA POWER" } : q.isError ? { c: "bg-destructive", t: "NASA POWER unavailable" } : { c: "bg-positive", t: "NASA POWER connected" };
  return (
    <div className="rounded-lg border border-sidebar-border bg-sidebar-accent p-3 text-xs">
      <div className="flex items-center gap-2 font-medium"><span className={cn("h-2 w-2 rounded-full", state.c)} />{state.t}</div>
      <p className="mt-1 flex items-center gap-1 text-sidebar-foreground/60"><Satellite className="h-3 w-3" />Daily point data · T2M/MAX/MIN, RH2M, PRECTOTCORR, ALLSKY</p>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { farm } = useFarm();
  const [open, setOpen] = useState(false);
  const nav = (
    <nav className="flex flex-col gap-0.5">
      {NAV.map((n) => {
        const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
        return (
          <Link key={n.to} to={n.to} onClick={() => setOpen(false)}
            className={cn("flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors", active ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground" : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground")}>
            <n.icon className="h-4 w-4" />{n.label}
          </Link>
        );
      })}
    </nav>
  );
  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col gap-6 bg-sidebar p-4 text-sidebar-foreground lg:flex">
        <Logo />{nav}<div className="mt-auto"><DataStatus /></div>
      </aside>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-64 flex-col gap-6 bg-sidebar p-4 text-sidebar-foreground">
            <div className="flex items-center justify-between"><Logo /><button aria-label="Close menu" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button></div>
            {nav}<div className="mt-auto"><DataStatus /></div>
          </aside>
        </div>
      )}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}><Menu className="h-5 w-5" /></button>
            <Link to="/farm" className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-1.5 text-xs hover:bg-secondary">
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="font-medium">{farm.region}</span>
              <span className="hidden font-mono text-muted-foreground sm:inline">{farm.latitude.toFixed(2)}°, {farm.longitude.toFixed(2)}°</span>
            </Link>
          </div>
          <span className="hidden text-xs text-muted-foreground md:block">{farm.name}</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
