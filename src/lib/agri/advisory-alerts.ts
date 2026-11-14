import type { DailyObservation } from '../nasa/types';

export interface ForecastWindow {
  timestamp: string;
  windSpeedMs: number;    // NASA POWER WS2M
  precipMm: number;       // NASA POWER PRECTOTCORR
  tempC: number;          // NASA POWER T2M
  vpdKpa: number;
}

export interface AgriAlert {
  id: string;
  level: 'info' | 'warning' | 'critical';
  title: string;
  actionRequired: string;
  timestamp: string;
}

export interface InputTimingWindow {
  timestamp: string;
  sprayingStatus: 'Optimal' | 'Caution (Drift Risk)' | 'Unsafe (Washoff/Drift)';
  fertilizerStatus: 'Optimal' | 'Suboptimal (Leaching/Volatilization Risk)';
  reason: string;
}

/**
 * Evaluates hourly/daily windows for safe pesticide spraying and nitrogen fertilizer application.
 */
export function evaluateInputTiming(windows: ForecastWindow[]): InputTimingWindow[] {
  return windows.map((w) => {
    let sprayingStatus: InputTimingWindow['sprayingStatus'] = 'Optimal';
    let fertilizerStatus: InputTimingWindow['fertilizerStatus'] = 'Optimal';
    const reasons: string[] = [];

    // Wind > 4.5 m/s causes spray drift; Rain > 2mm causes chemical washoff
    if (w.precipMm > 2.0) {
      sprayingStatus = 'Unsafe (Washoff/Drift)';
      fertilizerStatus = 'Suboptimal (Leaching/Volatilization Risk)';
      reasons.push(`Forecasted rainfall (${w.precipMm}mm) will cause nutrient runoff and spray washoff.`);
    } else if (w.windSpeedMs > 5.5) {
      sprayingStatus = 'Unsafe (Washoff/Drift)';
      reasons.push(`High wind speed (${w.windSpeedMs} m/s) creates severe off-target spray drift.`);
    } else if (w.windSpeedMs > 3.5) {
      sprayingStatus = 'Caution (Drift Risk)';
      reasons.push(`Moderate wind (${w.windSpeedMs} m/s); use coarse-droplet nozzles.`);
    }

    // High heat/VPD causes rapid spray evaporation and urea volatilization
    if (w.tempC > 32 && w.precipMm === 0) {
      fertilizerStatus = 'Suboptimal (Leaching/Volatilization Risk)';
      reasons.push(`High surface temperature (${w.tempC}°C) increases nitrogen volatilization.`);
    }

    return {
      timestamp: w.timestamp,
      sprayingStatus,
      fertilizerStatus,
      reason: reasons.length > 0 ? reasons.join(' ') : 'Ideal calm and dry microclimate window.',
    };
  });
}

/**
 * Generates real-time threshold breach alerts for the UI notification center.
 */
export function generateAutomatedAlerts(windows: ForecastWindow[]): AgriAlert[] {
  const alerts: AgriAlert[] = [];

  windows.forEach((w, idx) => {
    if (w.vpdKpa > 2.2) {
      alerts.push({
        id: `vpd-${idx}`,
        level: 'critical',
        title: 'Extreme Vapor Pressure Deficit Alert',
        actionRequired: `VPD reached ${w.vpdKpa} kPa on ${w.timestamp}. Trigger supplemental misting or irrigation to prevent stomatal closure.`,
        timestamp: w.timestamp,
      });
    }
    if (w.precipMm > 25) {
      alerts.push({
        id: `rain-${idx}`,
        level: 'warning',
        title: 'Heavy Precipitation & Waterlogging Risk',
        actionRequired: `${w.precipMm}mm rain expected on ${w.timestamp}. Clear field drainage channels and delay nitrogen top-dressing.`,
        timestamp: w.timestamp,
      });
    }
  });

  return alerts;
}

/**
 * Flags heavy rain and high mean temperatures in the latest observed week.
 */
export function generateObservationAlerts(days: DailyObservation[]): AgriAlert[] {
  const alerts: AgriAlert[] = [];
  const recentDays = days.slice(-7);

  if (!recentDays.some((day) => day.precip != null)) {
    alerts.push({
      id: 'rain-data-unavailable',
      level: 'info',
      title: 'Recent rainfall observations unavailable',
      actionRequired: 'NASA POWER returned no valid precipitation values in the latest available observations, so rainfall alerts could not be assessed.',
      timestamp: recentDays.at(-1)?.date ?? '—',
    });
  }

  if (!recentDays.some((day) => day.t2m != null)) {
    alerts.push({
      id: 'temperature-data-unavailable',
      level: 'info',
      title: 'Recent temperature observations unavailable',
      actionRequired: 'NASA POWER returned no valid daily mean temperature values in the latest available observations, so heat alerts could not be assessed.',
      timestamp: recentDays.at(-1)?.date ?? '—',
    });
  }

  recentDays.forEach((day) => {
    if (day.precip != null && day.precip > 25) {
      alerts.push({
        id: `rain-${day.date}`,
        level: 'warning',
        title: 'Heavy rainfall observed',
        actionRequired: `NASA POWER recorded ${day.precip} mm on ${day.date}. Check field drainage and inspect for waterlogging.`,
        timestamp: day.date,
      });
    }

    if (day.t2m != null && day.t2m > 32) {
      alerts.push({
        id: `heat-${day.date}`,
        level: 'warning',
        title: 'High daily mean temperature observed',
        actionRequired: `NASA POWER recorded a daily mean of ${day.t2m}°C on ${day.date}. Check crops for heat stress and verify irrigation needs.`,
        timestamp: day.date,
      });
    }
  });

  return alerts.reverse();
}