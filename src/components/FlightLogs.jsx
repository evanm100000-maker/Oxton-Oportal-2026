import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ClipboardList, PlusCircle, History, User, Users, Clipboard, Info, Calendar } from 'lucide-react';
import { compressImage } from '../utils/compressImage';

const escapeEmail = (email) => email ? email.replace(/\./g, ',') : '';

export default function FlightLogs() {
  const { flightLogs, submitFlightLog, flights, currentUser } = useApp();
  const [activeTab, setActiveTab] = useState('submit');
  const [successMsg, setSuccessMsg] = useState('');

  const [pilot, setPilot] = useState(currentUser.robloxUsername || '');
  const [selectedFlightId, setSelectedFlightId] = useState('');
  const [notes, setNotes] = useState('');
  const [photoProof, setPhotoProof] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const lockedFlights = flights.filter(f => {
    if (!f.locked) return false;
    const record = f.attendanceRecord;
    if (!record) return false;
    const myMark = record[escapeEmail(currentUser.email)];
    return myMark === 'Present' || myMark === 'Late';
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoProof(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pilot.trim() || !photoProof || !selectedFlightId) return;

    const flight = flights.find(f => f.id === selectedFlightId);
    if (!flight) return;

    setIsUploading(true);

    try {
      let finalPhotoProof = photoProof;
      if (photoProof.startsWith('data:image')) {
        // Compress image to avoid massive payloads
        finalPhotoProof = await compressImage(photoProof, 800, 0.6);
      }

      submitFlightLog({
        flightId: flight.id,
        flightCode: flight.flightCode,
        pilot: pilot.trim(),
        status: 'Completed',
        notes,
        photoProof: finalPhotoProof
      });

      // Reset Form
      setPilot(currentUser.robloxUsername || '');
      setSelectedFlightId('');
      setNotes('');
      setPhotoProof(null);
      if (document.getElementById('photo-upload-input')) {
        document.getElementById('photo-upload-input').value = '';
      }
      setSuccessMsg('Flight log submitted successfully!');
      setActiveTab('history');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (error) {
      console.error('Error uploading photo proof:', error);
      alert('Failed to upload photo proof. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const formatDate = (isoStr) => {
    return new Date(isoStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={styles.container}>
      <div style={styles.tabHeader}>
        <button
          onClick={() => setActiveTab('submit')}
          className="btn-secondary"
          style={{
            ...styles.tabBtn,
            background: activeTab === 'submit' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
            borderColor: activeTab === 'submit' ? '#2563eb' : 'transparent',
            color: activeTab === 'submit' ? 'var(--color-text-main)' : '#9ca3af',
          }}
        >
          <PlusCircle size={16} />
          Submit Flight Log
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className="btn-secondary"
          style={{
            ...styles.tabBtn,
            background: activeTab === 'history' ? 'rgba(37, 99, 235, 0.15)' : 'transparent',
            borderColor: activeTab === 'history' ? '#2563eb' : 'transparent',
            color: activeTab === 'history' ? 'var(--color-text-main)' : '#9ca3af',
          }}
        >
          <History size={16} />
          Log History ({flightLogs.length})
        </button>
      </div>

      {successMsg && (
        <div style={styles.successAlert}>
          <span>{successMsg}</span>
        </div>
      )}

      {activeTab === 'submit' ? (
        <form onSubmit={handleSubmit} style={styles.form} className="glass-panel">
          <h3 style={styles.sectionTitle}>New Flight Operations Log</h3>
          
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Select Locked Flight *</label>
            <select 
              required 
              value={selectedFlightId} 
              onChange={(e) => setSelectedFlightId(e.target.value)} 
              className="input-field"
            >
              <option value="">Select a flight...</option>
              {lockedFlights.map(f => (
                <option key={f.id} value={f.id}>
                  {f.flightCode} - {f.date} {f.time} ({f.location})
                </option>
              ))}
            </select>
          </div>
          
          <div style={styles.inputWrapper}>
            <label style={styles.label}>Roblox Username *</label>
            <div style={styles.iconInput}>
              <User size={16} style={styles.inputIcon} />
              <input
                type="text"
                required
                value={pilot}
                onChange={(e) => setPilot(e.target.value)}
                placeholder="e.g. PilotOxton"
                className="input-field"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          <div style={styles.inputWrapper}>
            <label style={styles.label}>Photo Proof *</label>
            <input
              id="photo-upload-input"
              type="file"
              accept="image/*"
              required
              onChange={handleFileUpload}
              className="input-field"
              style={{ padding: '8px' }}
            />
            {photoProof && (
              <img src={photoProof} alt="Preview" style={{ marginTop: '10px', maxHeight: '120px', borderRadius: '8px', objectFit: 'contain', alignSelf: 'flex-start' }} />
            )}
          </div>

          <div style={styles.inputWrapper}>
            <label style={styles.label}>Comment (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Provide a summary of the flight. List any delays, technical issues, passenger disturbances, or general comments..."
              className="input-field"
              style={styles.textarea}
              rows={4}
            />
          </div>

          <button type="submit" disabled={isUploading} className="btn-primary" style={{...styles.submitBtn, opacity: isUploading ? 0.7 : 1}}>
            <ClipboardList size={18} />
            <span>{isUploading ? 'Uploading...' : 'Submit Flight Log Entry'}</span>
          </button>
        </form>
      ) : (
        <div style={styles.historyContainer}>
          {flightLogs.length === 0 ? (
            <div style={styles.emptyState}>
              <Clipboard size={48} color="rgba(255,255,255,0.15)" />
              <p style={styles.emptyText}>No flight logs recorded in history.</p>
            </div>
          ) : (
            <div style={styles.logsList}>
              {(() => {
                const groupedLogs = {};
                const unassignedLogs = [];

                flightLogs.forEach(log => {
                  if (log.flightId) {
                    if (!groupedLogs[log.flightId]) groupedLogs[log.flightId] = [];
                    groupedLogs[log.flightId].push(log);
                  } else {
                    unassignedLogs.push(log);
                  }
                });

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    {Object.keys(groupedLogs).map(flightId => {
                      const flight = flights.find(f => f.id === flightId);
                      const group = groupedLogs[flightId];
                      return (
                        <div key={flightId} style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          {flight && (
                            <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                              <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '4px' }}>Flight: {flight.flightCode}</h4>
                              <div style={{ display: 'flex', gap: '16px', fontSize: '0.9rem', color: '#9ca3af' }}>
                                <span><Calendar size={12} style={{marginRight:'4px'}} />{flight.date}</span>
                                <span><ClipboardList size={12} style={{marginRight:'4px'}} />{flight.time} BST</span>
                                {flight.host && <span><User size={12} style={{marginRight:'4px'}} />Host: {flight.host}</span>}
                              </div>
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {group.map(log => (
                              <div key={log.id} style={styles.logCard} className="glass-panel">
                                <div style={styles.logHeader}>
                                  <div>
                                    <span style={styles.logCode}>{log.flightCode}</span>
                                    <span
                                      className="badge"
                                      style={{
                                        marginLeft: '10px',
                                        background: (log.status === 'Completed' || log.status === 'Approved') ? 'rgba(16,185,129,0.15)' : (log.status === 'Pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'),
                                        color: (log.status === 'Completed' || log.status === 'Approved') ? '#10b981' : (log.status === 'Pending' ? '#f59e0b' : '#ef4444'),
                                        border: (log.status === 'Completed' || log.status === 'Approved') ? '1px solid rgba(16,185,129,0.3)' : (log.status === 'Pending' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(239,68,68,0.3)')
                                      }}
                                    >
                                      {log.status}
                                    </span>
                                  </div>
                                  <span style={styles.logTime}>
                                    <Calendar size={12} style={{ marginRight: '4px' }} />
                                    {formatDate(log.timestamp)}
                                  </span>
                                </div>
              
                                <div style={styles.logRolesGrid}>
                                  <div style={styles.roleBox}>
                                    <span style={styles.roleLabel}>ROBLOX USERNAME</span>
                                    <span style={styles.roleValue}>{log.pilot}</span>
                                  </div>
                                  {flight && flight.attendanceRecord && flight.attendanceRecord[escapeEmail(log.submitterEmail)] && (
                                    <div style={styles.roleBox}>
                                      <span style={styles.roleLabel}>ATTENDANCE</span>
                                      <span style={{
                                        ...styles.roleValue, 
                                        color: flight.attendanceRecord[escapeEmail(log.submitterEmail)] === 'Present' ? '#10b981' : flight.attendanceRecord[escapeEmail(log.submitterEmail)] === 'Late' ? '#f59e0b' : '#ef4444'
                                      }}>
                                        {flight.attendanceRecord[escapeEmail(log.submitterEmail)]}
                                      </span>
                                    </div>
                                  )}
                                </div>
              
                                {log.photoProof && (
                                  <div style={styles.logRolesGrid}>
                                    <div style={styles.roleBox}>
                                      <span style={styles.roleLabel}>PHOTO PROOF</span>
                                      <div style={{ marginTop: '8px' }}>
                                        <img src={log.photoProof} alt="Proof" style={{ maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                                      </div>
                                    </div>
                                  </div>
                                )}
              
                                {log.notes && (
                                  <div style={styles.logNotes}>
                                    <Info size={14} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                                    <p style={styles.notesText}>{log.notes}</p>
                                  </div>
                                )}
              
                                <div style={styles.logFooter}>
                                  <span style={styles.submitterLabel}>
                                    Logged by: <strong>{log.submitterName}</strong> ({log.submitterEmail})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                    
                    {unassignedLogs.length > 0 && (
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <h4 style={{ color: '#fff', fontSize: '1.2rem', marginBottom: '4px' }}>Unassigned Logs</h4>
                          <p style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Logs submitted before flight grouping was enabled.</p>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                          {unassignedLogs.map((log) => (
                <div key={log.id} style={styles.logCard} className="glass-panel">
                  <div style={styles.logHeader}>
                    <div>
                      <span style={styles.logCode}>{log.flightCode}</span>
                      <span
                        className="badge"
                        style={{
                          marginLeft: '10px',
                          background: (log.status === 'Completed' || log.status === 'Approved') ? 'rgba(16,185,129,0.15)' : (log.status === 'Pending' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)'),
                          color: (log.status === 'Completed' || log.status === 'Approved') ? '#10b981' : (log.status === 'Pending' ? '#f59e0b' : '#ef4444'),
                          border: (log.status === 'Completed' || log.status === 'Approved') ? '1px solid rgba(16,185,129,0.3)' : (log.status === 'Pending' ? '1px solid rgba(245,158,11,0.3)' : '1px solid rgba(239,68,68,0.3)')
                        }}
                      >
                        {log.status}
                      </span>
                    </div>
                    <span style={styles.logTime}>
                      <Calendar size={12} style={{ marginRight: '4px' }} />
                      {formatDate(log.timestamp)}
                    </span>
                  </div>

                  <div style={styles.logRolesGrid}>
                    <div style={styles.roleBox}>
                      <span style={styles.roleLabel}>ROBLOX USERNAME</span>
                      <span style={styles.roleValue}>{log.pilot}</span>
                    </div>
                  </div>

                  {log.photoProof && (
                    <div style={styles.logRolesGrid}>
                      <div style={styles.roleBox}>
                        <span style={styles.roleLabel}>PHOTO PROOF</span>
                        <div style={{ marginTop: '8px' }}>
                          <img src={log.photoProof} alt="Proof" style={{ maxHeight: '200px', borderRadius: '8px', objectFit: 'contain' }} />
                        </div>
                      </div>
                    </div>
                  )}

                  {log.notes && (
                    <div style={styles.logNotes}>
                      <Info size={14} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <p style={styles.notesText}>{log.notes}</p>
                    </div>
                  )}

                  <div style={styles.logFooter}>
                    <span style={styles.submitterLabel}>
                      Logged by: <strong>{log.submitterName}</strong> ({log.submitterEmail})
                    </span>
                  </div>
                </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  tabHeader: {
    display: 'flex',
    gap: '12px',
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    paddingBottom: '12px',
  },
  tabBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 18px',
    borderRadius: '8px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  form: {
    padding: '32px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  sectionTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'var(--color-text-main)',
    marginBottom: '8px',
  },
  row: {
    display: 'flex',
    gap: '20px',
    flexWrap: 'wrap',
  },
  inputWrapper: {
    flex: 1,
    minWidth: '240px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#d1d5db',
  },
  iconInput: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'rgba(255,255,255,0.3)',
  },
  textarea: {
    resize: 'vertical',
  },
  submitBtn: {
    padding: '12px 20px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    marginTop: '10px',
  },
  successAlert: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    padding: '12px 16px',
    fontSize: '0.9rem',
    color: '#a7f3d0',
  },
  historyContainer: {
    display: 'flex',
    flexDirection: 'column',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '60px 0',
  },
  emptyText: {
    color: '#9ca3af',
    fontSize: '1rem',
  },
  logsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  logCard: {
    padding: '24px',
    borderRadius: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  logHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    paddingBottom: '12px',
  },
  logCode: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: 'var(--color-text-main)',
  },
  logTime: {
    fontSize: '0.8rem',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
  },
  logRolesGrid: {
    display: 'flex',
    gap: '24px',
    flexWrap: 'wrap',
  },
  roleBox: {
    flex: 1,
    minWidth: '140px',
    background: 'rgba(0,0,0,0.15)',
    border: '1px solid rgba(255,255,255,0.03)',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  roleLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#3b82f6',
    letterSpacing: '0.5px',
  },
  roleValue: {
    fontSize: '0.95rem',
    color: '#f3f4f6',
    fontWeight: '500',
  },
  logNotes: {
    background: 'rgba(37, 99, 235, 0.05)',
    border: '1px solid rgba(37, 99, 235, 0.1)',
    borderRadius: '8px',
    padding: '14px 16px',
    display: 'flex',
    gap: '10px',
    alignItems: 'flex-start',
  },
  notesText: {
    fontSize: '0.85rem',
    color: '#d1d5db',
    lineHeight: '1.45',
  },
  logFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    fontSize: '0.8rem',
    color: '#9ca3af',
  },
  submitterLabel: {
    fontWeight: '400',
  },
};
