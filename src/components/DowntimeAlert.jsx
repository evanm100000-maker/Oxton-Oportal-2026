import React from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle } from 'lucide-react';

export default function DowntimeAlert() {
  const { downtimeConfig } = useApp();

  if (!downtimeConfig?.isActive) return null;

  return (
    <div className="downtime-overlay">
      <div className="downtime-box slam-element">
        <div className="downtime-icon-container">
          <AlertTriangle size={64} color="#1f2937" />
        </div>
        <div className="downtime-content">
          <div className="downtime-header">
            {downtimeConfig.title}
          </div>
          <div className="downtime-body">
            {downtimeConfig.message}
          </div>
        </div>
      </div>
    </div>
  );
}
