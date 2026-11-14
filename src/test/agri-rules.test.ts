import { describe, expect, it } from "vitest";
import { computeStats } from "@/lib/agri/climate";
import { assessRisks } from "@/lib/agri/risk";
import { buildRotations } from "@/lib/agri/recommend";
import { DEFAULT_FARM } from "@/lib/agri/soil";
import { generateObservationAlerts } from "@/lib/agri/advisory-alerts";

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
  it("generates alerts from only recent observed rainfall and temperature thresholds", () => {
    const observations = [
      { date: "2025-12-31", t2m: 33, precip: 30, solar: 20 },
      ...Array.from({ length: 6 }, (_, i) => ({
        date: `2026-01-${String(i + 1).padStart(2, "0")}`,
        t2m: 24,
        precip: 0.2,
        solar: 20,
      })),
      { date: "2026-01-08", t2m: 33, precip: 30, solar: 20 },
    ];

    const alerts = generateObservationAlerts(observations);

    expect(alerts).toHaveLength(2);
    expect(alerts.map((alert) => alert.title)).toContain("Heavy rainfall observed");
    expect(alerts.map((alert) => alert.title)).toContain("High daily mean temperature observed");
    expect(alerts.every((alert) => alert.timestamp === "2026-01-08")).toBe(true);
  });
  it("reports when recent measurements are missing instead of showing an all-clear", () => {
    const alerts = generateObservationAlerts([
      { date: "2026-01-08", t2m: null, precip: null, solar: null },
    ]);

    expect(alerts.map((alert) => alert.level)).toEqual(["info", "info"]);
    expect(alerts.map((alert) => alert.title)).toContain("Recent rainfall observations unavailable");
    expect(alerts.map((alert) => alert.title)).toContain("Recent temperature observations unavailable");
  });
});
