import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { AgriAlert } from '@/lib/agri/advisory-alerts';

interface AlertCenterProps {
  alerts?: AgriAlert[];
}

const getAlertStyles = (level?: AgriAlert['level']) => {
  switch (level) {
    case 'critical':
      return {
        container: 'border-red-500/40 bg-red-950/30 text-red-100',
        icon: 'text-red-400',
        iconNode: AlertTriangle,
      };
    case 'warning':
      return {
        container: 'border-amber-500/40 bg-amber-950/30 text-amber-100',
        icon: 'text-amber-400',
        iconNode: Info,
      };
    default:
      return {
        container: 'border-sky-500/40 bg-sky-950/30 text-sky-100',
        icon: 'text-sky-400',
        iconNode: Info,
      };
  }
};

export const AlertCenter: React.FC<AlertCenterProps> = ({ alerts = [] }) => {
  if (alerts.length === 0) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-200">
        <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
        <span>No heavy-rainfall or high-temperature thresholds were exceeded in the latest available observations.</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const styles = getAlertStyles(alert.level);
        const Icon = styles.iconNode;

        return (
          <div
            key={alert.id}
            className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${styles.container}`}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${styles.icon}`} />
            <div>
              <div className="font-semibold">
                {alert.title} <span className="text-xs opacity-75">({alert.timestamp})</span>
              </div>
              <p className="mt-1 opacity-90">{alert.actionRequired}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
};