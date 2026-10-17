import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCall } from '../context/CallContext';
import { useApp } from '../context/AppContext';
import { 
  Phone, 
  PhoneCall, 
  PhoneOff, 
  PhoneIncoming, 
  Mic, 
  MicOff, 
  Headphones, 
  Volume2, 
  Volume1,
  VolumeX, 
  User, 
  Minimize2, 
  Maximize2,
  Sliders,
  Settings,
  ChevronDown
} from 'lucide-react';

export default function VoiceCallOverlay() {
  const { 
    activeCall, 
    callRole, 
    callStatus, 
    incomingCall, 
    isMuted, 
    isDeafened, 
    callDuration, 
    remoteSpeaking, 
    localSpeaking,
    isMinimized, 
    setIsMinimized,
    // Device & Volume Controls
    selectedMicId,
    availableMics,
    micVolume,
    peerVolume,
    micInputLevel,
    changeMicrophone,
    setMicVolume,
    setPeerVolume,
    refreshAudioDevices,
    // Call Actions
    answerCall, 
    declineCall, 
    endCall, 
    toggleMute, 
    toggleDeafen 
  } = useCall();
  const { currentUser } = useApp();

  const [showSettings, setShowSettings] = useState(false);

  const formatDuration = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine other user's info for active call
  const peerInfo = React.useMemo(() => {
    if (!activeCall) return { name: 'Staff Member', pfp: '', roblox: '', muted: false, deafened: false };
    if (activeCall.type === 'group') {
      const isCaller = callRole === 'caller';
      return {
        name: isCaller ? (activeCall.groupTitle || 'Group Voice Call') : (activeCall.callerName || 'Group Voice Call'),
        subTitle: isCaller ? `${activeCall.members?.length || 0} Members in Call` : (activeCall.groupTitle || 'Group Voice Call'),
        pfp: isCaller ? '' : activeCall.callerPfp,
        roblox: isCaller ? '' : activeCall.callerRoblox,
        muted: isCaller ? activeCall.receiverMuted : activeCall.callerMuted,
        deafened: isCaller ? activeCall.receiverDeafened : activeCall.callerDeafened
      };
    }
    const isCaller = callRole === 'caller';
    return {
      name: isCaller ? activeCall.receiverName : activeCall.callerName,
      subTitle: isCaller ? (activeCall.receiverRoblox ? `@${activeCall.receiverRoblox}` : '') : (activeCall.callerRoblox ? `@${activeCall.callerRoblox}` : ''),
      pfp: isCaller ? activeCall.receiverPfp : activeCall.callerPfp,
      roblox: isCaller ? activeCall.receiverRoblox : activeCall.callerRoblox,
      muted: isCaller ? activeCall.receiverMuted : activeCall.callerMuted,
      deafened: isCaller ? activeCall.receiverDeafened : activeCall.callerDeafened
    };
  }, [activeCall, callRole]);

  return (
    <>
      {/* 1. INCOMING CALL POPUP (Recipient) */}
      <AnimatePresence>
        {incomingCall && !activeCall && (
          <div style={styles.modalBackdrop}>
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: -20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              style={styles.incomingModal}
              className="glass-panel"
            >
              {/* Animated Ring Radar */}
              <div style={styles.avatarWrapper}>
                <div style={styles.radarPulse}></div>
                <div style={styles.avatarContainer}>
                  {incomingCall.callerPfp ? (
                    <img 
                      src={incomingCall.callerPfp} 
                      alt={incomingCall.callerName} 
                      style={styles.avatarImg}
                    />
                  ) : (
                    <div style={styles.avatarFallback}>
                      <User size={38} color="#9ca3af" />
                    </div>
                  )}
                </div>
                <div style={styles.incomingBadge}>
                  <PhoneIncoming size={16} color="#10b981" />
                </div>
              </div>

              {/* Caller Details */}
              <div style={styles.callerDetails}>
                <span style={styles.callTypeLabel}>
                  {incomingCall.type === 'group' 
                    ? (incomingCall.groupTitle || 'Incoming Group Call') 
                    : 'Incoming Voice Call'}
                </span>
                <h3 style={styles.callerName}>{incomingCall.callerName || 'Staff Member'}</h3>
                {incomingCall.callerRoblox && (
                  <span style={styles.callerRoblox}>@{incomingCall.callerRoblox}</span>
                )}
              </div>

              {/* Action Buttons: Answer & Decline */}
              <div style={styles.incomingActions}>
                <button 
                  onClick={declineCall}
                  style={styles.declineBtn}
                  title="Decline Call"
                >
                  <PhoneOff size={22} />
                  <span>Decline</span>
                </button>

                <button 
                  onClick={answerCall}
                  style={styles.answerBtn}
                  title="Answer Call"
                >
                  <PhoneCall size={22} />
                  <span>Answer</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. ACTIVE CALL / OUTGOING CALL FLOATING DOCK */}
      <AnimatePresence>
        {activeCall && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 22, stiffness: 300 }}
            style={{
              ...styles.activeCallDock,
              ...(isMinimized ? styles.dockMinimized : styles.dockExpanded)
            }}
            className="glass-panel"
          >
            {/* Header / Minimize / Settings bar */}
            <div style={styles.dockHeader}>
              <div style={styles.statusIndicator}>
                <span 
                  style={{
                    ...styles.statusDot, 
                    backgroundColor: callStatus === 'connected' ? '#10b981' : '#f59e0b' 
                  }}
                />
                <span style={styles.statusText}>
                  {callStatus === 'connected' ? `Voice Call • ${formatDuration(callDuration)}` : 
                   callStatus === 'calling' ? 'Calling...' : 
                   callStatus === 'declined' ? 'Call Declined' :
                   callStatus === 'ended' ? 'Call Ended' : 'Connecting...'}
                </span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button 
                  onClick={() => {
                    setShowSettings(!showSettings);
                    refreshAudioDevices();
                  }}
                  style={{
                    ...styles.iconMiniBtn,
                    color: showSettings ? '#10b981' : '#9ca3af',
                    background: showSettings ? 'rgba(16, 185, 129, 0.15)' : 'transparent'
                  }}
                  title="Audio & Microphone Settings"
                >
                  <Sliders size={14} />
                </button>
                <button 
                  onClick={() => setIsMinimized(!isMinimized)} 
                  style={styles.iconMiniBtn}
                  title={isMinimized ? "Expand" : "Minimize"}
                >
                  {isMinimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
                </button>
              </div>
            </div>

            {/* Minimized View */}
            {isMinimized ? (
              <div style={styles.minimizedContent}>
                <div style={styles.miniUser}>
                  <div style={styles.miniAvatarContainer}>
                    {peerInfo.pfp ? (
                      <img src={peerInfo.pfp} alt={peerInfo.name} style={styles.miniAvatar} />
                    ) : (
                      <User size={16} color="#9ca3af" />
                    )}
                  </div>
                  <span style={styles.miniName}>{peerInfo.name}</span>
                </div>
                <div style={styles.miniControls}>
                  <button 
                    onClick={toggleMute} 
                    style={{
                      ...styles.miniControlBtn, 
                      backgroundColor: isMuted ? '#ef4444' : 'rgba(255,255,255,0.1)'
                    }}
                    title={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                  <button 
                    onClick={endCall} 
                    style={{ ...styles.miniControlBtn, backgroundColor: '#dc2626' }}
                    title="End Call"
                  >
                    <PhoneOff size={14} />
                  </button>
                </div>
              </div>
            ) : (
              /* Expanded View */
              <div style={styles.expandedContent}>
                {/* Peer Card with live speaking halo */}
                <div style={styles.peerSection}>
                  <div 
                    style={{
                      ...styles.peerAvatarContainer,
                      borderColor: remoteSpeaking ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
                      boxShadow: remoteSpeaking ? '0 0 16px rgba(16, 185, 129, 0.5)' : 'none'
                    }}
                  >
                    {peerInfo.pfp ? (
                      <img src={peerInfo.pfp} alt={peerInfo.name} style={styles.peerAvatar} />
                    ) : (
                      <div style={styles.peerAvatarFallback}>
                        <User size={32} color="#9ca3af" />
                      </div>
                    )}
                    {peerInfo.muted && (
                      <div style={styles.peerStatusBadge} title="Peer is muted">
                        <MicOff size={12} color="#ef4444" />
                      </div>
                    )}
                    {peerInfo.deafened && (
                      <div style={{ ...styles.peerStatusBadge, left: 0, right: 'auto' }} title="Peer is deafened">
                        <VolumeX size={12} color="#ef4444" />
                      </div>
                    )}
                  </div>

                  <div style={styles.peerDetails}>
                    <h4 style={styles.peerName}>{peerInfo.name}</h4>
                    {peerInfo.roblox ? (
                      <span style={styles.peerRoblox}>@{peerInfo.roblox}</span>
                    ) : peerInfo.subTitle ? (
                      <span style={styles.peerRoblox}>{peerInfo.subTitle}</span>
                    ) : null}
                    <div style={styles.peerSubStatus}>
                      {remoteSpeaking ? (
                        <span style={{ color: '#10b981', fontSize: '0.78rem', fontWeight: 600 }}>Speaking...</span>
                      ) : peerInfo.deafened ? (
                        <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>Deafened</span>
                      ) : peerInfo.muted ? (
                        <span style={{ color: '#ef4444', fontSize: '0.78rem' }}>Muted</span>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '0.78rem' }}>Voice Connected</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* AUDIO SETTINGS DRAWER */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      style={styles.settingsDrawer}
                    >
                      {/* 1. Microphone Selector */}
                      <div style={styles.settingGroup}>
                        <div style={styles.settingLabelRow}>
                          <label style={styles.settingLabel}>
                            <Mic size={13} color="#34d399" />
                            <span>Microphone Device</span>
                          </label>
                        </div>
                        <select
                          value={selectedMicId}
                          onChange={(e) => changeMicrophone(e.target.value)}
                          style={styles.deviceSelect}
                        >
                          <option value="">Default Microphone</option>
                          {availableMics.map(mic => (
                            <option key={mic.deviceId} value={mic.deviceId}>
                              {mic.label || `Microphone (${mic.deviceId.slice(0, 8)})`}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 2. My Mic Volume (Input Gain) */}
                      <div style={styles.settingGroup}>
                        <div style={styles.settingLabelRow}>
                          <label style={styles.settingLabel}>
                            <Mic size={13} color="#60a5fa" />
                            <span>My Mic Loudness</span>
                          </label>
                          <span style={styles.volumeValueBadge}>{micVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          step="1"
                          value={micVolume}
                          onChange={(e) => setMicVolume(e.target.value)}
                          style={styles.rangeSlider}
                        />
                        {/* Live Mic Level Test Meter */}
                        <div style={styles.meterContainer} title="Live Microphone Test Meter">
                          <div 
                            style={{
                              ...styles.meterFill,
                              width: `${micInputLevel}%`,
                              backgroundColor: micInputLevel > 75 ? '#f59e0b' : '#10b981'
                            }}
                          />
                        </div>
                      </div>

                      {/* 3. Peer Volume (Turn other person up or down) */}
                      <div style={styles.settingGroup}>
                        <div style={styles.settingLabelRow}>
                          <label style={styles.settingLabel}>
                            {peerVolume === 0 ? (
                              <VolumeX size={13} color="#ef4444" />
                            ) : peerVolume < 80 ? (
                              <Volume1 size={13} color="#34d399" />
                            ) : (
                              <Volume2 size={13} color="#34d399" />
                            )}
                            <span>{peerInfo.name}'s Volume</span>
                          </label>
                          <span style={styles.volumeValueBadge}>{peerVolume}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          step="1"
                          value={peerVolume}
                          onChange={(e) => setPeerVolume(e.target.value)}
                          style={styles.rangeSlider}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Call Control Buttons */}
                <div style={styles.callControlsRow}>
                  {/* MUTE BUTTON */}
                  <button
                    onClick={toggleMute}
                    style={{
                      ...styles.controlBtn,
                      backgroundColor: isMuted ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                      borderColor: isMuted ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
                      color: isMuted ? '#f87171' : '#f3f4f6'
                    }}
                    title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
                  >
                    {isMuted ? <MicOff size={18} /> : <Mic size={18} />}
                    <span style={styles.btnLabel}>{isMuted ? 'Unmute' : 'Mute'}</span>
                  </button>

                  {/* DEAFEN BUTTON */}
                  <button
                    onClick={toggleDeafen}
                    style={{
                      ...styles.controlBtn,
                      backgroundColor: isDeafened ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.08)',
                      borderColor: isDeafened ? '#ef4444' : 'rgba(255, 255, 255, 0.15)',
                      color: isDeafened ? '#f87171' : '#f3f4f6'
                    }}
                    title={isDeafened ? "Undeafen (Unmute audio)" : "Deafen (Silence incoming audio)"}
                  >
                    {isDeafened ? <VolumeX size={18} /> : <Headphones size={18} />}
                    <span style={styles.btnLabel}>{isDeafened ? 'Undeafen' : 'Deafen'}</span>
                  </button>

                  {/* END CALL BUTTON */}
                  <button
                    onClick={endCall}
                    style={styles.hangupBtn}
                    title="End Call"
                  >
                    <PhoneOff size={18} />
                    <span style={styles.btnLabel}>End</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

const styles = {
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999
  },
  incomingModal: {
    background: 'rgba(18, 22, 34, 0.95)',
    border: '1px solid rgba(59, 130, 246, 0.35)',
    borderRadius: '24px',
    padding: '36px 32px',
    width: '90%',
    maxWidth: '380px',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(59, 130, 246, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  },
  avatarWrapper: {
    position: 'relative',
    width: '96px',
    height: '96px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  radarPulse: {
    position: 'absolute',
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '2px solid rgba(16, 185, 129, 0.6)',
    animation: 'pulse-ring 1.8s infinite ease-out'
  },
  avatarContainer: {
    width: '84px',
    height: '84px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '3px solid #10b981',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
    zIndex: 2
  },
  avatarImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#1e293b'
  },
  incomingBadge: {
    position: 'absolute',
    bottom: '0px',
    right: '4px',
    backgroundColor: '#064e3b',
    border: '2px solid #10b981',
    borderRadius: '50%',
    padding: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3
  },
  callerDetails: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  callTypeLabel: {
    fontSize: '0.8rem',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    color: '#10b981',
    fontWeight: '700'
  },
  callerName: {
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#f9fafb',
    margin: 0
  },
  callerRoblox: {
    fontSize: '0.9rem',
    color: '#9ca3af'
  },
  incomingActions: {
    display: 'flex',
    gap: '20px',
    width: '100%',
    justifyContent: 'center',
    marginTop: '8px'
  },
  declineBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 20px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)'
  },
  answerBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '14px 20px',
    borderRadius: '14px',
    border: 'none',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    color: '#fff',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
  },

  // Active Call Dock
  activeCallDock: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: 99990,
    background: 'rgba(15, 23, 42, 0.94)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    borderRadius: '20px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px rgba(59, 130, 246, 0.2)',
    overflow: 'hidden',
    transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
  },
  dockExpanded: {
    width: '330px',
    padding: '16px'
  },
  dockMinimized: {
    width: '240px',
    padding: '12px 14px'
  },
  dockHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '12px'
  },
  statusIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  statusText: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#e5e7eb'
  },
  iconMiniBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '5px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease'
  },

  // Minimized Content
  minimizedContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px'
  },
  miniUser: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    overflow: 'hidden'
  },
  miniAvatarContainer: {
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    overflow: 'hidden',
    backgroundColor: '#374151',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  miniAvatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  miniName: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#f3f4f6',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  miniControls: {
    display: 'flex',
    gap: '6px'
  },
  miniControlBtn: {
    border: 'none',
    color: '#fff',
    borderRadius: '8px',
    padding: '6px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Expanded Content
  expandedContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px'
  },
  peerSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    padding: '10px',
    borderRadius: '14px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    border: '1px solid rgba(255, 255, 255, 0.06)'
  },
  peerAvatarContainer: {
    position: 'relative',
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    overflow: 'hidden',
    border: '2px solid rgba(255, 255, 255, 0.15)',
    transition: 'all 0.2s ease',
    flexShrink: 0
  },
  peerAvatar: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  peerAvatarFallback: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937'
  },
  peerStatusBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#18181b',
    border: '1px solid rgba(239, 68, 68, 0.5)',
    borderRadius: '50%',
    padding: '3px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  peerDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    overflow: 'hidden'
  },
  peerName: {
    fontSize: '0.98rem',
    fontWeight: '700',
    color: '#f9fafb',
    margin: 0,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  peerRoblox: {
    fontSize: '0.78rem',
    color: '#9ca3af'
  },
  peerSubStatus: {
    marginTop: '2px'
  },

  // Settings Drawer
  settingsDrawer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '12px',
    borderRadius: '12px',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    overflow: 'hidden'
  },
  settingGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  settingLabelRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  settingLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#d1d5db'
  },
  volumeValueBadge: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#34d399',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    padding: '1px 6px',
    borderRadius: '6px'
  },
  deviceSelect: {
    width: '100%',
    padding: '6px 8px',
    borderRadius: '8px',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    color: '#f3f4f6',
    fontSize: '0.78rem',
    outline: 'none',
    cursor: 'pointer'
  },
  rangeSlider: {
    width: '100%',
    cursor: 'pointer',
    accentColor: '#10b981',
    height: '4px'
  },
  meterContainer: {
    width: '100%',
    height: '4px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: '2px',
    overflow: 'hidden',
    marginTop: '2px'
  },
  meterFill: {
    height: '100%',
    transition: 'width 0.08s ease-out'
  },

  // Controls Row
  callControlsRow: {
    display: 'flex',
    gap: '10px',
    width: '100%'
  },
  controlBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '10px 6px',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    cursor: 'pointer',
    transition: 'all 0.15s ease'
  },
  hangupBtn: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    padding: '10px 6px',
    borderRadius: '12px',
    border: 'none',
    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
    color: '#fff',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 12px rgba(239, 68, 68, 0.35)'
  },
  btnLabel: {
    fontSize: '0.72rem',
    fontWeight: '600'
  }
};
