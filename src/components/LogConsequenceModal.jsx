import React, { useState, useMemo } from 'react';
import { ShieldAlert, X } from 'lucide-react';
import { canTakeAction } from '../context/AppContext';
import {
  C5_OPTIONS,
  C6_OPTION,
  isC6Consequence,
  resolveC5Suspension,
  CustomSuspensionFields,
  SanctionScheduleFields,
} from './ConsequenceLoggedModal';

/**
 * Isolated modal for logging consequences.
 * Owns its own form state so typing never re-renders background consequence lists.
 */
const LogConsequenceModal = React.memo(function LogConsequenceModal({
  isOpen,
  onClose,
  users = [],
  currentUser,
  infractions = [],
  onSubmitConsequence,
}) {
  const [staffEmail, setStaffEmail] = useState('');
  const [infType, setInfType] = useState('C1 Warning');
  const [category, setCategory] = useState('Behavior');
  const [mainMessage, setMainMessage] = useState('');
  const [confidentialMessage, setConfidentialMessage] = useState('');
  const [detentionLocation, setDetentionLocation] = useState('Hall');
  const [detentionDate, setDetentionDate] = useState(() => new Date(Date.now() + 86400000).toISOString().split('T')[0]);
  const [detentionTime, setDetentionTime] = useState('17:15 - 17:35');
  const [customSuspensionValue, setCustomSuspensionValue] = useState('');
  const [customSuspensionUnit, setCustomSuspensionUnit] = useState('days');
  const [errorMsg, setErrorMsg] = useState('');

  const eligibleStaff = useMemo(() => {
    const curEmail = currentUser?.email?.toLowerCase().trim();
    return (users || []).filter(
      u => u && u.approved && u.role !== 'passenger' && u.email?.toLowerCase().trim() !== curEmail && canTakeAction(currentUser, u)
    );
  }, [users, currentUser]);

  if (!isOpen) return null;

  const resetForm = () => {
    setStaffEmail('');
    setInfType('C1 Warning');
    setCategory('Behavior');
    setMainMessage('');
    setConfidentialMessage('');
    setDetentionLocation('Hall');
    setDetentionDate(new Date(Date.now() + 86400000).toISOString().split('T')[0]);
    setDetentionTime('17:15 - 17:35');
    setCustomSuspensionValue('');
    setCustomSuspensionUnit('days');
    setErrorMsg('');
  };

  const handleClose = () => {
    setErrorMsg('');
    onClose();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!staffEmail || !mainMessage.trim()) {
      setErrorMsg('Please select a staff member and provide reason details.');
      return;
    }

    const isDetention = infType.startsWith('C4');
    const isCourse = isC6Consequence(infType);
    const isScheduled = isDetention || isCourse;

    const c5Resolved = resolveC5Suspension(infType, customSuspensionValue, customSuspensionUnit);
    if (!c5Resolved.valid) {
      setErrorMsg(c5Resolved.error);
      return;
    }

    if (isDetention) {
      const scheduledDate = (detentionDate || '').trim();
      const existingC4ForDate = (infractions || []).find(
        inf =>
          inf &&
          inf.staffEmail?.toLowerCase() === staffEmail.toLowerCase() &&
          (inf.type?.startsWith('C4') || inf.type?.toLowerCase().includes('detention')) &&
          (inf.detentionDate || '').trim() === scheduledDate
      );
      if (existingC4ForDate) {
        setErrorMsg('Unable to log: C4 detention is already scheduled on this date for this staff member.');
        return;
      }
    }

    const targetUser = (users || []).find(u => u && u.email?.toLowerCase() === staffEmail.toLowerCase());
    const consequencePayload = {
      staffEmail,
      targetUser,
      type: c5Resolved.type,
      mainMessage: `[${category}] ${mainMessage.trim()}`,
      rawMessage: mainMessage.trim(),
      confidentialMessage: confidentialMessage.trim(),
      detentionLocation: isScheduled ? (detentionLocation || (isCourse ? 'Behavioral Course' : 'Hall')) : null,
      detentionDate: isScheduled ? detentionDate : null,
      detentionTime: isScheduled ? detentionTime : null,
      suspensionDurationHours: c5Resolved.suspensionDurationHours,
      suspensionDurationLabel: c5Resolved.suspensionDurationLabel,
    };

    const ok = onSubmitConsequence(consequencePayload);
    if (ok === false) {
      setErrorMsg('Could not log consequence. Please verify staff permissions.');
      return;
    }

    resetForm();
  };

  return (
    <div style={modalStyles.overlay} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="glass-panel" style={modalStyles.box}>
        <div style={modalStyles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={modalStyles.iconBadge}>
              <ShieldAlert size={20} color="#ef4444" />
            </div>
            <div>
              <h3 style={{ margin: 0, color: 'var(--color-text-main)', fontSize: '1.15rem', fontWeight: '700' }}>
                Log Staff Consequence
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                Select a staff member, action tier, and incident details.
              </p>
            </div>
          </div>
          <button type="button" onClick={handleClose} style={modalStyles.closeBtn} title="Close">
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={modalStyles.errorBanner}>{errorMsg}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Staff Member *</label>
            <select
              required
              value={staffEmail}
              onChange={e => setStaffEmail(e.target.value)}
              className="input-field"
            >
              <option value="">Select staff member...</option>
              {eligibleStaff.map(u => (
                <option key={u.email} value={u.email}>
                  {u.firstName} {u.lastName} (@{u.robloxUsername || 'user'}) &mdash; {u.email}
                  {u.suspendedUntil && new Date(u.suspendedUntil).getTime() > Date.now() ? ' [Suspended]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
            <div style={modalStyles.field}>
              <label style={modalStyles.label}>Consequence Action Level *</label>
              <select
                value={infType}
                onChange={e => {
                  const val = e.target.value;
                  setInfType(val);
                  if (isC6Consequence(val)) {
                    setDetentionTime('17:15 - 18:00');
                    setDetentionLocation('Behavioral Course');
                  } else if (val.includes('C4B')) {
                    setDetentionTime('17:15 - 17:55');
                    setDetentionLocation('Hall');
                  } else if (val.includes('C4A')) {
                    setDetentionTime('17:15 - 17:35');
                    setDetentionLocation('Hall');
                  }
                }}
                className="input-field"
              >
                <option value="C1 Warning">C1 - Warning (1 pt)</option>
                <option value="C2 Warning">C2 - Warning (2 pts)</option>
                <option value="C3 Informal Sanction">C3 - Informal Sanction (3 pts)</option>
                <option value="C4A - Infraction + 20m Detention">C4A - Infraction + 20m Detention (4 pts)</option>
                <option value="C4B - 40m Detention">C4B - 40m Detention (4 pts)</option>
                {C5_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
                <option value={C6_OPTION.value}>{C6_OPTION.label}</option>
              </select>
            </div>

            <div style={modalStyles.field}>
              <label style={modalStyles.label}>Reason Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)} className="input-field">
                <option value="Behavior">Behavior</option>
                <option value="Verbal assault">Verbal assault</option>
                <option value="Refusing a reasonable request">Refusing a reasonable request</option>
                <option value="Absence">Absence</option>
                <option value="Insubordination">Insubordination</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {infType === 'C5 - Custom Suspension' && (
            <CustomSuspensionFields
              durationValue={customSuspensionValue}
              onDurationChange={setCustomSuspensionValue}
              durationUnit={customSuspensionUnit}
              onUnitChange={setCustomSuspensionUnit}
            />
          )}

          {(infType.startsWith('C4') || isC6Consequence(infType)) && (
            <SanctionScheduleFields
              isC6={isC6Consequence(infType)}
              locationValue={detentionLocation}
              onLocationChange={setDetentionLocation}
              dateValue={detentionDate}
              onDateChange={setDetentionDate}
              timeValue={detentionTime}
              onTimeChange={setDetentionTime}
            />
          )}

          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Reason & Details * (Visible to staff member)</label>
            <textarea
              required
              value={mainMessage}
              onChange={e => setMainMessage(e.target.value)}
              placeholder="Explain the incident, shift context, and expectations..."
              rows="3"
              className="input-field"
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={modalStyles.field}>
            <label style={modalStyles.label}>Confidential Note (Admin only)</label>
            <textarea
              value={confidentialMessage}
              onChange={e => setConfidentialMessage(e.target.value)}
              placeholder="Optional internal administrative notes..."
              rows="2"
              className="input-field"
              style={{ borderColor: 'rgba(6, 182, 212, 0.3)', background: 'rgba(6, 182, 212, 0.03)', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button type="button" onClick={handleClose} className="btn-secondary" style={{ padding: '10px 18px', borderRadius: '8px' }}>
              Cancel
            </button>
            <button type="submit" className="btn-danger" style={modalStyles.submitBtn}>
              <ShieldAlert size={16} /> Publish Consequence
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

const modalStyles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(2, 6, 23, 0.78)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
  },
  box: {
    width: '100%',
    maxWidth: '560px',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: 'rgba(15, 23, 42, 0.96)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 24px 50px -12px rgba(0, 0, 0, 0.75)',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '14px',
  },
  iconBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(239, 68, 68, 0.16)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
  },
  errorBanner: {
    padding: '10px 12px',
    borderRadius: '8px',
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.35)',
    color: '#fca5a5',
    fontSize: '0.84rem',
    fontWeight: '600',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#cbd5e1',
  },
  submitBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '700',
    cursor: 'pointer',
  },
};

export default LogConsequenceModal;
