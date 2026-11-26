import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  ClipboardList,
  Plane,
  Calendar,
  Clock,
  Users,
  Check,
  X,
  ArrowLeft,
  Search,
  Radio,
  Info
} from 'lucide-react';
import { formatFlightForViewer, getFlightUtcDate } from '../utils/timeUtils';

const escapeEmail = (email) => (email ? email.toLowerCase().trim().replace(/\./g, ',') : '');
const unescapeEmail = (email) => (email ? email.replace(/,/g, '.') : '');

export const BOARD_TIERS = [
  { key: 'c1_c3', label: 'C1-C3', color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.2)', border: 'rgba(59, 130, 246, 0.5)' },
  { key: 'c4a', label: 'C4A', color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.2)', border: 'rgba(245, 158, 11, 0.5)' },
  { key: 'c4b', label: 'C4B', color: '#fb923c', bg: 'rgba(249, 115, 22, 0.2)', border: 'rgba(249, 115, 22, 0.5)' },
  { key: 'c5', label: 'C5', color: '#f87171', bg: 'rgba(239, 68, 68, 0.2)', border: 'rgba(239, 68, 68, 0.5)' },
];

export function getAllocatedEmailsForFlight(flight) {
  if (!flight) return [];
  const seen = new Map(); // normalizedLower -> originalEmail

  const addEmail = (raw) => {
    if (!raw) return;
    const norm = raw.toLowerCase().trim();
    if (!seen.has(norm)) seen.set(norm, raw.trim());
  };

  (flight.allocatedStaff || []).forEach(e => {
    const safe = e ? e.replace(/\./g, ',') : '';
    const safeLower = escapeEmail(e);
    const st =
      flight.staffStatus?.[safe] ||
      flight.staffStatus?.[safeLower] ||
      flight.staffStatus?.[e];
    if (st !== 'Absent' && st !== 'Undecided') {
      addEmail(e);
    }
  });

  if (flight.staffStatus) {
    Object.keys(flight.staffStatus).forEach(k => {
      if (flight.staffStatus[k] === 'Attending') {
        addEmail(unescapeEmail(k));
      }
    });
  }

  return Array.from(seen.values());
}

export function sortFlightsStartingWithToday(flights = [], todayIsoOverride = null) {
  const now = new Date();
  const todayIso =
    todayIsoOverride ||
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return [...(flights || [])].filter(Boolean).sort((a, b) => {
    const va = formatFlightForViewer(a);
    const vb = formatFlightForViewer(b);
    const dateA = va.dateIso || a.date || '';
    const dateB = vb.dateIso || b.date || '';

    const bucketA = dateA === todayIso || a.date === todayIso ? 0 : dateA > todayIso ? 1 : 2;
    const bucketB = dateB === todayIso || b.date === todayIso ? 0 : dateB > todayIso ? 1 : 2;

    if (bucketA !== bucketB) return bucketA - bucketB;

    const timeA = getFlightUtcDate(a)?.getTime() || new Date(`${a.date || ''}T${a.time || '00:00'}`).getTime() || 0;
    const timeB = getFlightUtcDate(b)?.getTime() || new Date(`${b.date || ''}T${b.time || '00:00'}`).getTime() || 0;

    // Today & upcoming: earliest first; Past: most recent first
    return bucketA === 2 ? timeB - timeA : timeA - timeB;
  });
}

export default function ConsequenceBoardModal({ isOpen, onClose }) {
  const { flights = [], users = [], toggleConsequenceBoardTick } = useApp();
  const [selectedFlightId, setSelectedFlightId] = useState(null);
  const [flightSearch, setFlightSearch] = useState('');
  const [staffSearch, setStaffSearch] = useState('');

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const sortedFlights = useMemo(() => {
    return sortFlightsStartingWithToday(flights, todayIso);
  }, [flights, todayIso]);

  const filteredFlights = useMemo(() => {
    const q = flightSearch.toLowerCase().trim();
    if (!q) return sortedFlights;
    return sortedFlights.filter(f => {
      const timing = formatFlightForViewer(f);
      return `${f.flightCode || ''} ${f.location || ''} ${f.host || ''} ${f.date || ''} ${timing.date || ''}`
        .toLowerCase()
        .includes(q);
    });
  }, [sortedFlights, flightSearch]);

  const selectedFlight = useMemo(() => {
    if (!selectedFlightId) return null;
    return (flights || []).find(f => f && (f.id === selectedFlightId || f._firebaseKey === selectedFlightId)) || null;
  }, [flights, selectedFlightId]);

  const allocatedStaffRows = useMemo(() => {
    if (!selectedFlight) return [];
    const emails = getAllocatedEmailsForFlight(selectedFlight);
    const board = selectedFlight.consequenceBoard || {};

    return emails
      .map(email => {
        const norm = email.toLowerCase().trim();
        const user = (users || []).find(u => u && u.email?.toLowerCase().trim() === norm);
        const safe = escapeEmail(email);
        const rawSafe = email.replace(/\./g, ',');
        const entry = board[safe] || board[rawSafe] || board[email] || {};
        return {
          email,
          name: user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || email : email,
          robloxUsername: user?.robloxUsername || '',
          role: user?.customRole || user?.siteRole || 'Staff',
          entry
        };
      })
      .filter(row => {
        const q = staffSearch.toLowerCase().trim();
        if (!q) return true;
        return `${row.name} ${row.robloxUsername} ${row.email} ${row.role}`.toLowerCase().includes(q);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [selectedFlight, users, staffSearch]);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedFlightId(null);
    setFlightSearch('');
    setStaffSearch('');
    onClose();
  };

  return (
    <div style={styles.overlay} onClick={e => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="glass-panel" style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {selectedFlight && (
              <button
                type="button"
                onClick={() => {
                  setSelectedFlightId(null);
                  setStaffSearch('');
                }}
                className="btn-secondary"
                style={styles.backBtn}
                title="Back to All Flights"
              >
                <ArrowLeft size={16} />
                <span>Flights</span>
              </button>
            )}
            <div style={styles.iconBox}>
              <ClipboardList size={22} color="#60a5fa" />
            </div>
            <div>
              <div style={styles.kickerRow}>
                <span style={styles.kicker}>Consequence Board System</span>
                <span style={styles.livePill}>
                  <Radio size={11} /> Live Sync
                </span>
              </div>
              <h3 style={styles.title}>
                {selectedFlight
                  ? `${selectedFlight.flightCode || 'Flight'} — ${selectedFlight.location || 'Operations'}`
                  : 'Select a Flight'}
              </h3>
            </div>
          </div>

          <button type="button" onClick={handleClose} style={styles.closeBtn} title="Close">
            <X size={20} />
          </button>
        </div>

        {/* Info Banner */}
        <div style={styles.noticeBanner}>
          <Info size={16} color="#60a5fa" style={{ flexShrink: 0 }} />
          <span>
            Ticks sync immediately for everyone viewing this board. Ticking a box does <strong>not</strong> log an infraction—the staff member must still formally log the consequence.
          </span>
        </div>

        {/* View 1: All Flights List (Starting with Today's Flight) */}
        {!selectedFlight && (
          <div style={styles.bodySection}>
            <div style={styles.toolbarRow}>
              <div style={styles.searchWrap}>
                <Search size={16} color="#94a3b8" style={styles.searchIcon} />
                <input
                  type="text"
                  value={flightSearch}
                  onChange={e => setFlightSearch(e.target.value)}
                  placeholder="Search flights by code, location, host, or date..."
                  className="input-field"
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
              </div>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600' }}>
                {filteredFlights.length} flight{filteredFlights.length === 1 ? '' : 's'}
              </span>
            </div>

            {filteredFlights.length === 0 ? (
              <div style={styles.emptyBox}>
                <Plane size={42} color="rgba(148, 163, 184, 0.25)" />
                <p style={{ margin: 0, color: '#94a3b8' }}>No flights found.</p>
              </div>
            ) : (
              <div style={styles.flightList}>
                {filteredFlights.map(flight => {
                  const timing = formatFlightForViewer(flight);
                  const isToday = timing.dateIso === todayIso || flight.date === todayIso;
                  const isUpcoming = !isToday && (timing.dateIso || flight.date || '') > todayIso;
                  const crewCount = getAllocatedEmailsForFlight(flight).length;
                  const board = flight.consequenceBoard || {};
                  const tickCount = Object.values(board).reduce((acc, entry) => {
                    if (!entry || typeof entry !== 'object') return acc;
                    return acc + BOARD_TIERS.filter(t => entry[t.key]).length;
                  }, 0);

                  return (
                    <button
                      key={flight.id || flight._firebaseKey}
                      type="button"
                      onClick={() => setSelectedFlightId(flight.id || flight._firebaseKey)}
                      style={{
                        ...styles.flightCard,
                        borderColor: isToday ? 'rgba(16, 185, 129, 0.45)' : 'rgba(255,255,255,0.08)',
                        background: isToday ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255,255,255,0.03)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: '200px' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          background: isToday ? 'rgba(16, 185, 129, 0.18)' : 'rgba(59, 130, 246, 0.14)',
                          border: `1px solid ${isToday ? 'rgba(16, 185, 129, 0.4)' : 'rgba(59, 130, 246, 0.3)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          <Plane size={18} color={isToday ? '#34d399' : '#60a5fa'} />
                        </div>
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '1rem', color: 'var(--color-text-main)' }}>
                              {flight.flightCode || 'Flight'}
                            </strong>
                            {isToday && <span style={styles.todayBadge}>Today</span>}
                            {isUpcoming && <span style={styles.upcomingBadge}>Upcoming</span>}
                            {!isToday && !isUpcoming && <span style={styles.pastBadge}>Past</span>}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '3px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            <span>{flight.location || 'TBA'}</span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Calendar size={12} /> {timing.date || flight.date}
                            </span>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Clock size={12} /> {timing.time || flight.time} {timing.timezone}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={styles.crewPill}>
                          <Users size={13} /> {crewCount} Staff
                        </span>
                        {tickCount > 0 && (
                          <span style={styles.tickCountPill}>
                            {tickCount} Tick{tickCount === 1 ? '' : 's'}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* View 2: Allocated Staff Board for Selected Flight */}
        {selectedFlight && (
          <div style={styles.bodySection}>
            <div style={styles.toolbarRow}>
              <div style={styles.searchWrap}>
                <Search size={16} color="#94a3b8" style={styles.searchIcon} />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={e => setStaffSearch(e.target.value)}
                  placeholder="Filter allocated staff..."
                  className="input-field"
                  style={{ paddingLeft: '36px', width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.82rem', color: '#94a3b8' }}>
                <span>
                  <Calendar size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                  {formatFlightForViewer(selectedFlight).date || selectedFlight.date}
                </span>
                <span>&bull;</span>
                <span>{allocatedStaffRows.length} Allocated</span>
              </div>
            </div>

            {allocatedStaffRows.length === 0 ? (
              <div style={styles.emptyBox}>
                <Users size={42} color="rgba(148, 163, 184, 0.25)" />
                <p style={{ margin: 0, color: '#94a3b8' }}>
                  No staff members are currently allocated to this flight.
                </p>
              </div>
            ) : (
              <div style={styles.tableWrapper}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.trHead}>
                      <th style={styles.th}>Allocated Staff Member</th>
                      {BOARD_TIERS.map(tier => (
                        <th key={tier.key} style={{ ...styles.th, textAlign: 'center', color: tier.color, width: '92px' }}>
                          {tier.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allocatedStaffRows.map(row => (
                      <tr key={row.email} style={styles.trBody}>
                        <td style={styles.td}>
                          <div style={{ fontWeight: '700', color: 'var(--color-text-main)', fontSize: '0.92rem' }}>
                            {row.name}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {row.robloxUsername && <span>@{row.robloxUsername}</span>}
                            <span>{row.role}</span>
                          </div>
                        </td>
                        {BOARD_TIERS.map(tier => {
                          const isChecked = Boolean(row.entry?.[tier.key]);
                          const updatedBy = row.entry?.[`${tier.key}UpdatedBy`];
                          return (
                            <td key={tier.key} style={{ ...styles.td, textAlign: 'center' }}>
                              <button
                                type="button"
                                role="checkbox"
                                aria-checked={isChecked}
                                aria-label={`${tier.label} for ${row.name}`}
                                title={isChecked ? `${tier.label} ticked${updatedBy ? ` by ${updatedBy}` : ''} (click to untick)` : `Tick ${tier.label} for ${row.name}`}
                                onClick={() => toggleConsequenceBoardTick(selectedFlight.id || selectedFlight._firebaseKey, row.email, tier.key)}
                                style={{
                                  ...styles.tickBtn,
                                  background: isChecked ? tier.bg : 'rgba(255,255,255,0.04)',
                                  borderColor: isChecked ? tier.border : 'rgba(255,255,255,0.16)',
                                  color: isChecked ? tier.color : 'transparent',
                                  boxShadow: isChecked ? `0 0 10px ${tier.bg}` : 'none'
                                }}
                              >
                                <Check size={16} strokeWidth={3} />
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(2, 6, 23, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1200,
    padding: '20px',
  },
  modal: {
    width: '100%',
    maxWidth: '880px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    padding: '24px',
    borderRadius: '18px',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    paddingBottom: '14px',
    flexShrink: 0,
  },
  backBtn: {
    padding: '7px 12px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.82rem',
    fontWeight: '600',
  },
  iconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '12px',
    background: 'rgba(59, 130, 246, 0.15)',
    border: '1px solid rgba(59, 130, 246, 0.35)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  kickerRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  kicker: {
    fontSize: '0.72rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    color: '#60a5fa',
  },
  livePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '0.68rem',
    fontWeight: '700',
    padding: '1px 7px',
    borderRadius: '999px',
    background: 'rgba(16, 185, 129, 0.16)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.35)',
  },
  title: {
    margin: '2px 0 0 0',
    fontSize: '1.22rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: '#94a3b8',
    cursor: 'pointer',
    padding: '4px',
  },
  noticeBanner: {
    padding: '10px 14px',
    borderRadius: '10px',
    background: 'rgba(59, 130, 246, 0.1)',
    border: '1px solid rgba(59, 130, 246, 0.25)',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '0.83rem',
    color: '#cbd5e1',
    flexShrink: 0,
  },
  bodySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    overflowY: 'auto',
    paddingRight: '2px',
  },
  toolbarRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  searchWrap: {
    position: 'relative',
    flex: '1 1 260px',
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
  },
  flightList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  flightCard: {
    width: '100%',
    padding: '14px 16px',
    borderRadius: '12px',
    border: '1px solid',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    cursor: 'pointer',
    transition: 'transform 0.15s ease, border-color 0.15s ease',
  },
  todayBadge: {
    fontSize: '0.7rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: '6px',
    background: 'rgba(16, 185, 129, 0.2)',
    color: '#34d399',
    border: '1px solid rgba(16, 185, 129, 0.4)',
  },
  upcomingBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: '6px',
    background: 'rgba(59, 130, 246, 0.18)',
    color: '#60a5fa',
    border: '1px solid rgba(59, 130, 246, 0.35)',
  },
  pastBadge: {
    fontSize: '0.7rem',
    fontWeight: '700',
    textTransform: 'uppercase',
    padding: '2px 8px',
    borderRadius: '6px',
    background: 'rgba(148, 163, 184, 0.14)',
    color: '#94a3b8',
    border: '1px solid rgba(148, 163, 184, 0.25)',
  },
  crewPill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '0.78rem',
    fontWeight: '700',
    background: 'rgba(255,255,255,0.06)',
    color: 'var(--color-text-main)',
  },
  tickCountPill: {
    padding: '4px 10px',
    borderRadius: '8px',
    fontSize: '0.78rem',
    fontWeight: '700',
    background: 'rgba(245, 158, 11, 0.18)',
    color: '#fbbf24',
    border: '1px solid rgba(245, 158, 11, 0.35)',
  },
  emptyBox: {
    padding: '48px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    textAlign: 'center',
  },
  tableWrapper: {
    overflowX: 'auto',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  trHead: {
    background: 'rgba(255,255,255,0.04)',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  th: {
    padding: '12px 14px',
    fontSize: '0.78rem',
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    color: '#94a3b8',
    textAlign: 'left',
  },
  trBody: {
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  td: {
    padding: '12px 14px',
    verticalAlign: 'middle',
  },
  tickBtn: {
    width: '34px',
    height: '34px',
    borderRadius: '9px',
    border: '2px solid',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
};
