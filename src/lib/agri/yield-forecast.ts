export interface DailyMeteoRecord {
  date: string;
  tMax: number;        // °C (T2M_MAX)
  tMin: number;        // °C (T2M_MIN)
  precip: number;      // mm (PRECTOTCORR)
  rh: number;          // % (RH2M)
}

export interface ExtremeWeatherEvent {
  type: 'Heatwave' | 'Flash Drought' | 'Frost Risk' | 'Heavy Deluge';
  severity: 'Moderate' | 'High' | 'Critical';
  startDate: string;
  durationDays: number;
  details: string;
}

export interface YieldForecastReport {
  accumulatedGDD: number;
  meanVPD: number; // kPa
  predictedYieldTonnesPerHa: number;
  confidenceInterval: [number, number];
  extremeEvents: ExtremeWeatherEvent[];
}

/**
 * Calculates Vapor Pressure Deficit (kPa) - key indicator of atmospheric drying stress on crops.
 */
export function calculateVPD(tMax: number, tMin: number, rhMean: number): number {
  const esTmax = 0.6108 * Math.exp((17.27 * tMax) / (tMax + 237.3));
  const esTmin = 0.6108 * Math.exp((17.27 * tMin) / (tMin + 237.3));
  const es = (esTmax + esTmin) / 2;
  const ea = es * (rhMean / 100);
  return Number(Math.max(es - ea, 0).toFixed(2));
}

/**
 * Forecasts crop yield and scans time-series data for extreme weather windows.
 */
export function generateYieldAndRiskForecast(
  records: DailyMeteoRecord[],
  cropConfig: { baseTemp: number; optimalGDD: number; potentialYield: number }
): YieldForecastReport {
  let accumulatedGDD = 0;
  let totalVPD = 0;
  const extremeEvents: ExtremeWeatherEvent[] = [];

  let consecutiveHotDays = 0;
  let consecutiveDryDays = 0;

  records.forEach((day) => {
    const tAvg = (day.tMax + day.tMin) / 2;
    const dailyGDD = Math.max(tAvg - cropConfig.baseTemp, 0);
    accumulatedGDD += dailyGDD;

    const vpd = calculateVPD(day.tMax, day.tMin, day.rh);
    totalVPD += vpd;

    // Heatwave detection (>35°C for 3+ consecutive days)
    if (day.tMax >= 35) {
      consecutiveHotDays++;
      if (consecutiveHotDays === 3) {
        extremeEvents.push({
          type: 'Heatwave',
          severity: 'High',
          startDate: day.date,
          durationDays: 3,
          details: `Sustained canopy temperatures exceeding 35°C detected; risk of pollen sterility.`,
        });
      }
    } else {
      consecutiveHotDays = 0;
    }

    // Flash drought detection (<1mm rain + VPD > 1.8 kPa)
    if (day.precip < 1.0 && vpd > 1.8) {
      consecutiveDryDays++;
      if (consecutiveDryDays === 7) {
        extremeEvents.push({
          type: 'Flash Drought',
          severity: 'Critical',
          startDate: day.date,
          durationDays: 7,
          details: `Rapid root-zone moisture depletion driven by high Vapor Pressure Deficit (${vpd} kPa).`,
        });
      }
    } else {
      consecutiveDryDays = 0;
    }

    // Frost detection
    if (day.tMin <= 2.0) {
      extremeEvents.push({
        type: 'Frost Risk',
        severity: day.tMin <= 0 ? 'Critical' : 'Moderate',
        startDate: day.date,
        durationDays: 1,
        details: `Minimum temperature dropped to ${day.tMin}°C; cellular frost damage probable.`,
      });
    }
  });

  const meanVPD = records.length ? Number((totalVPD / records.length).toFixed(2)) : 0;
  const gddRatio = Math.min(accumulatedGDD / cropConfig.optimalGDD, 1.15);
  const stressPenalty = extremeEvents.length * 0.06 + (meanVPD > 1.6 ? 0.1 : 0);

  const predictedYield = Number(
    Math.max(cropConfig.potentialYield * gddRatio * (1 - stressPenalty), 0.4).toFixed(2)
  );

  return {
    accumulatedGDD: Math.round(accumulatedGDD),
    meanVPD,
    predictedYieldTonnesPerHa: predictedYield,
    confidenceInterval: [
      Number((predictedYield * 0.9).toFixed(2)),
      Number((predictedYield * 1.1).toFixed(2)),
    ],
    extremeEvents,
  };
}