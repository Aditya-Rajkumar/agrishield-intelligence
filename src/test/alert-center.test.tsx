import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AlertCenter } from '@/components/app/AlertCenter';

describe('AlertCenter', () => {
  it('shows the healthy-state message when no alerts are present', () => {
    render(<AlertCenter alerts={[]} />);

    expect(screen.getByText(/no heavy-rainfall or high-temperature thresholds were exceeded/i)).toBeInTheDocument();
  });

  it('renders informational alerts without crashing for non-critical levels', () => {
    render(
      <AlertCenter
        alerts={[
          {
            id: 'info-1',
            level: 'info',
            title: 'Soil moisture trending normal',
            actionRequired: 'Continue monitoring the field and keep irrigation on standby.',
            timestamp: '2026-01-15',
          },
        ]}
      />,
    );

    expect(screen.getByText('Soil moisture trending normal')).toBeInTheDocument();
    expect(screen.getByText(/continue monitoring the field/i)).toBeInTheDocument();
  });
});
