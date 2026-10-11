import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AlertTriangle, AlertOctagon, CheckCircle, X } from 'lucide-react';

export default function WarningBanner() {
  const { warningConfig } = useApp();
  const [timeLeft, setTimeLeft] = useState({ minutes: 0, seconds: 0, isExpired: false });
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    if (!warningConfig?.countdownEnabled || !warningConfig?.countdownTarget) return;

    const calculateTimeLeft = () => {
      const targetString = warningConfig.countdownTarget.includes('+') || warningConfig.countdownTarget.includes('Z') 
           ? warningConfig.countdownTarget 
           : `${warningConfig.countdownTarget}+01:00`;
      const difference = new Date(targetString) - new Date();
      if (difference <= 0) {
        return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
      }
      return {
        hours: Math.floor(difference / (1000 * 60 * 60)),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isExpired: false
      };
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [warningConfig?.countdownEnabled, warningConfig?.countdownTarget]);

  if (!warningConfig?.isActive || isClosed) return null;

  const type = warningConfig.type || 'warning';

  let Icon = AlertTriangle;
  if (type === 'issue') Icon = AlertOctagon;
  if (type === 'resolved') Icon = CheckCircle;

  return (
    <div className="warning-banner-container slam-element">
      <div className={`warning-box ${type}`} style={{ position: 'relative' }}>
        <button 
          onClick={() => setIsClosed(true)} 
          style={{ position: 'absolute', top: '12px', right: '12px', background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7 }}
        >
          <X size={20} />
        </button>
        <div className="warning-icon-container">
          <Icon size={48} color="#1f2937" />
        </div>
        <div className="warning-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%', gap: '12px' }}>
          <div>
            <div className="warning-header">
              {warningConfig.title}
            </div>
            <div className="warning-body">
              {warningConfig.message}
            </div>
          </div>
          {warningConfig.countdownEnabled && (
            <div style={{
              fontSize: '2rem',
              fontWeight: '900',
              fontFamily: 'monospace',
              color: timeLeft.isExpired ? '#ef4444' : '#1f2937',
              marginTop: '8px',
              padding: '10px 20px',
              background: 'rgba(0,0,0,0.05)',
              borderRadius: '12px',
              alignSelf: 'flex-start'
            }}>
              {String(timeLeft.hours || 0).padStart(2, '0')}:{String(timeLeft.minutes || 0).padStart(2, '0')}:{String(timeLeft.seconds || 0).padStart(2, '0')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
