import { describe, expect, it } from "vitest";
import { computeStats } from "@/lib/agri/climate";
import { assessRisks } from "@/lib/agri/risk";
import { buildRotations } from "@/lib/agri/recommend";
import { DEFAULT_FARM } from "@/lib/agri/soil";

const days = Array.from({ length: 30 }, (_, i) => ({ date: `2026-01-${String(i + 1).padStart(2, "0")}`, t2m: 24, precip: i === 3 ? null : 0.2, solar: 20 }));

describe("agri rules", () => {
  it("excludes NASA missing values from stats instead of filling them", () => {
    const s = computeStats(days);
    expect(s.missing.precip).toBe(1);
    expect(s.totalRain).toBeCloseTo(29 * 0.2);
  });
  it("a long dry spell on a low-water farm is high drought risk", () => {
    const r = assessRisks(computeStats(days), { ...DEFAULT_FARM, water: "low" });
    expect(r.find((x) => x.id === "drought")?.level).toBe("high");
  });
  it("the save-water priority ranks the water-saving rotation above the market rotation", () => {
    const rot = buildRotations({ soilType: "black_cotton", soilPh: 7.2, water: "medium", currentCrop: "Grapes", priorities: ["water"] }, computeStats(days));
    expect(rot.findIndex((r) => r.id === "water")).toBeLessThan(rot.findIndex((r) => r.id === "market"));
  });
});
