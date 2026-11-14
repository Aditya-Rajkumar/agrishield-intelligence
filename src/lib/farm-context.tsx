import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { DEFAULT_FARM, type FarmProfile } from "./agri/soil";
import { climateQuery, defaultRange } from "./nasa/queries";

interface Ctx { farm: FarmProfile; setFarm: (f: FarmProfile) => void; update: (p: Partial<FarmProfile>) => void }
const FarmCtx = createContext<Ctx | null>(null);
const KEY = "agrishield.farm";

export function FarmProvider({ children }: { children: ReactNode }) {
  const [farm, setFarm] = useState<FarmProfile>(DEFAULT_FARM);
  useEffect(() => {
    try { const raw = localStorage.getItem(KEY); if (raw) setFarm({ ...DEFAULT_FARM, ...JSON.parse(raw) }); } catch { /* ignore */ }
  }, []);
  const value = useMemo<Ctx>(() => ({
    farm,
    setFarm: (f) => { setFarm(f); localStorage.setItem(KEY, JSON.stringify(f)); },
    update: (p) => setFarm((prev) => { const n = { ...prev, ...p }; localStorage.setItem(KEY, JSON.stringify(n)); return n; }),
  }), [farm]);
  return <FarmCtx.Provider value={value}>{children}</FarmCtx.Provider>;
}

export function useFarm() {
  const c = useContext(FarmCtx);
  if (!c) throw new Error("useFarm outside FarmProvider");
  return c;
}

/** 90-day observation window for the selected farm. */
export function useFarmClimate(range = defaultRange(90)) {
  const { farm } = useFarm();
  return useQuery(climateQuery({ latitude: farm.latitude, longitude: farm.longitude, ...range }));
}
