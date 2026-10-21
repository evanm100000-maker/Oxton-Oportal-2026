import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, RefreshCw, Volume2, HelpCircle, Check, AlertCircle } from 'lucide-react';

// Real photographic image challenges matching official Google reCAPTCHA format
const CHALLENGES = [
  {
    id: 'airplanes',
    title: 'airplanes',
    instruction: 'Select all squares with airplanes',
    tiles: [
      { id: 'a1', isTarget: true, img: './captcha/airplanes/1.jpg' },
      { id: 'd1', isTarget: false, img: './captcha/decoys/1.jpg' },
      { id: 'a2', isTarget: true, img: './captcha/airplanes/2.jpg' },
      { id: 'd2', isTarget: false, img: './captcha/decoys/2.jpg' },
      { id: 'a3', isTarget: true, img: './captcha/airplanes/3.jpg' },
      { id: 'd3', isTarget: false, img: './captcha/decoys/3.jpg' },
      { id: 'd4', isTarget: false, img: './captcha/decoys/4.jpg' },
      { id: 'a4', isTarget: true, img: './captcha/airplanes/4.jpg' },
      { id: 'd5', isTarget: false, img: './captcha/decoys/5.jpg' },
    ]
  },
  {
    id: 'traffic_lights',
    title: 'traffic lights',
    instruction: 'Select all squares with traffic lights',
    tiles: [
      { id: 'tl1', isTarget: true, img: './captcha/traffic_lights/1.jpg' },
      { id: 'd1', isTarget: false, img: './captcha/decoys/6.jpg' },
      { id: 'tl2', isTarget: true, img: './captcha/traffic_lights/2.jpg' },
      { id: 'd2', isTarget: false, img: './captcha/decoys/7.jpg' },
      { id: 'd3', isTarget: false, img: './captcha/decoys/8.jpg' },
      { id: 'tl3', isTarget: true, img: './captcha/traffic_lights/3.jpg' },
      { id: 'd4', isTarget: false, img: './captcha/decoys/1.jpg' },
      { id: 'tl4', isTarget: true, img: './captcha/traffic_lights/4.jpg' },
      { id: 'd5', isTarget: false, img: './captcha/decoys/2.jpg' },
    ]
  },
  {
    id: 'bicycles',
    title: 'bicycles',
    instruction: 'Select all squares with bicycles',
    tiles: [
      { id: 'b1', isTarget: true, img: './captcha/bicycles/1.jpg' },
      { id: 'd1', isTarget: false, img: './captcha/decoys/3.jpg' },
      { id: 'd2', isTarget: false, img: './captcha/decoys/4.jpg' },
      { id: 'b2', isTarget: true, img: './captcha/bicycles/2.jpg' },
      { id: 'd3', isTarget: false, img: './captcha/decoys/5.jpg' },
      { id: 'b3', isTarget: true, img: './captcha/bicycles/3.jpg' },
      { id: 'd4', isTarget: false, img: './captcha/decoys/6.jpg' },
      { id: 'd5', isTarget: false, img: './captcha/decoys/7.jpg' },
      { id: 'b4', isTarget: true, img: './captcha/bicycles/4.jpg' },
    ]
  },
  {
    id: 'buses',
    title: 'buses',
    instruction: 'Select all squares with buses',
    tiles: [
      { id: 'bu1', isTarget: true, img: './captcha/buses/1.jpg' },
      { id: 'd1', isTarget: false, img: './captcha/decoys/8.jpg' },
      { id: 'bu2', isTarget: true, img: './captcha/buses/2.jpg' },
      { id: 'd2', isTarget: false, img: './captcha/decoys/1.jpg' },
      { id: 'd3', isTarget: false, img: './captcha/decoys/2.jpg' },
      { id: 'bu3', isTarget: true, img: './captcha/buses/3.jpg' },
      { id: 'd4', isTarget: false, img: './captcha/decoys/3.jpg' },
      { id: 'bu4', isTarget: true, img: './captcha/buses/4.jpg' },
      { id: 'd5', isTarget: false, img: './captcha/decoys/4.jpg' },
    ]
  },
  {
    id: 'crosswalks',
    title: 'crosswalks',
    instruction: 'Select all squares with crosswalks',
    tiles: [
      { id: 'cw1', isTarget: true, img: './captcha/crosswalks/1.jpg' },
      { id: 'd1', isTarget: false, img: './captcha/decoys/5.jpg' },
      { id: 'cw2', isTarget: true, img: './captcha/crosswalks/2.jpg' },
      { id: 'd2', isTarget: false, img: './captcha/decoys/6.jpg' },
      { id: 'd3', isTarget: false, img: './captcha/decoys/7.jpg' },
      { id: 'cw3', isTarget: true, img: './captcha/crosswalks/3.jpg' },
      { id: 'd4', isTarget: false, img: './captcha/decoys/8.jpg' },
      { id: 'cw4', isTarget: true, img: './captcha/crosswalks/4.jpg' },
      { id: 'd5', isTarget: false, img: './captcha/decoys/1.jpg' },
    ]
  }
];

export default function Captcha({ onVerify, verified = false, onReset }) {
  const [isChecked, setIsChecked] = useState(verified);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [shuffledTiles, setShuffledTiles] = useState([]);

  // Audio/Canvas code fallback challenge
  const [showCodeChallenge, setShowCodeChallenge] = useState(false);
  const [canvasCode, setCanvasCode] = useState('');
  const [userCodeInput, setUserCodeInput] = useState('');
  const canvasRef = useRef(null);

  const currentChallenge = CHALLENGES[challengeIdx] || CHALLENGES[0];

  // Initialize or shuffle challenge tiles
  const initChallenge = useCallback((idx) => {
    const ch = CHALLENGES[idx];
    const tilesCopy = [...ch.tiles];
    for (let i = tilesCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tilesCopy[i], tilesCopy[j]] = [tilesCopy[j], tilesCopy[i]];
    }
    setShuffledTiles(tilesCopy);
    setSelectedTiles([]);
    setErrorMsg('');
  }, []);

  // Sync external verified state
  useEffect(() => {
    setIsChecked(verified);
  }, [verified]);

  // Generate canvas distorted text for alternative challenge
  const generateCanvasCode = useCallback(() => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCanvasCode(code);
    setUserCodeInput('');
    setErrorMsg('');

    setTimeout(() => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, 160, 50);
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(0, 0, 160, 50);

        // Noise lines
        for (let i = 0; i < 4; i++) {
          ctx.strokeStyle = `rgba(${Math.floor(Math.random()*150+100)}, ${Math.floor(Math.random()*150+100)}, 255, 0.5)`;
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(Math.random() * 160, Math.random() * 50);
          ctx.bezierCurveTo(Math.random() * 160, Math.random() * 50, Math.random() * 160, Math.random() * 50, Math.random() * 160, Math.random() * 50);
          ctx.stroke();
        }

        // Draw wavy text
        ctx.font = 'bold 26px "Courier New", monospace';
        for (let i = 0; i < code.length; i++) {
          ctx.save();
          ctx.fillStyle = ['#60a5fa', '#38bdf8', '#34d399', '#f472b6', '#fbbf24'][i % 5];
          const x = 20 + i * 26;
          const y = 34 + (Math.random() * 8 - 4);
          ctx.translate(x, y);
          ctx.rotate((Math.random() - 0.5) * 0.4);
          ctx.fillText(code[i], 0, 0);
          ctx.restore();
        }
      }
    }, 50);
  }, []);

  const handleCheckboxClick = () => {
    if (isChecked) return;
    setIsVerifying(true);
    setErrorMsg('');

    // Authentic behavior: click checkbox -> show spinner for 550ms -> open challenge modal
    setTimeout(() => {
      setIsVerifying(false);
      const nextIdx = Math.floor(Math.random() * CHALLENGES.length);
      setChallengeIdx(nextIdx);
      initChallenge(nextIdx);
      setShowChallenge(true);
    }, 550);
  };

  const toggleTile = (index) => {
    setSelectedTiles(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  const handleVerify = () => {
    const targetIndices = shuffledTiles
      .map((t, idx) => t.isTarget ? idx : null)
      .filter(idx => idx !== null);

    const isMatch = 
      targetIndices.length === selectedTiles.length &&
      selectedTiles.every(idx => targetIndices.includes(idx));

    if (isMatch) {
      setShowChallenge(false);
      setIsChecked(true);
      if (onVerify) onVerify(true);
    } else {
      setErrorMsg('Please try again. Select all matching squares.');
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);

      // Refresh with another challenge after a slight delay
      setTimeout(() => {
        const nextIdx = (challengeIdx + 1) % CHALLENGES.length;
        setChallengeIdx(nextIdx);
        initChallenge(nextIdx);
      }, 700);
    }
  };

  const handleVerifyCode = () => {
    if (userCodeInput.trim().toUpperCase() === canvasCode) {
      setShowChallenge(false);
      setShowCodeChallenge(false);
      setIsChecked(true);
      if (onVerify) onVerify(true);
    } else {
      setErrorMsg('Incorrect code. Please try again.');
      generateCanvasCode();
    }
  };

  const handleReload = () => {
    const nextIdx = (challengeIdx + 1) % CHALLENGES.length;
    setChallengeIdx(nextIdx);
    initChallenge(nextIdx);
  };

  return (
    <div style={styles.widgetContainer}>
      {/* Authentic reCAPTCHA Box Widget */}
      <div 
        style={{
          ...styles.recaptchaBox,
          borderColor: isChecked ? '#10b981' : 'rgba(255, 255, 255, 0.15)',
        }}
        onClick={handleCheckboxClick}
      >
        <div style={styles.leftSection}>
          <div 
            style={{
              ...styles.checkboxSquare,
              borderColor: isChecked ? '#10b981' : (isVerifying ? '#3b82f6' : '#9ca3af'),
              backgroundColor: isChecked ? '#10b981' : 'transparent',
              cursor: isChecked ? 'default' : 'pointer'
            }}
          >
            {isVerifying && (
              <div style={styles.spinner} />
            )}
            {isChecked && !isVerifying && (
              <Check size={18} color="#ffffff" strokeWidth={3} />
            )}
          </div>
          <span style={styles.checkboxLabel}>
            {isChecked ? "I'm not a robot" : "I'm not a robot"}
          </span>
        </div>

        <div style={styles.badgeSection}>
          <div style={styles.badgeIcon}>
            <ShieldCheck size={26} color="#3b82f6" />
          </div>
          <span style={styles.badgeTitle}>reCAPTCHA</span>
          <span style={styles.badgeLinks}>Privacy - Terms</span>
        </div>
      </div>

      {/* Realistic reCAPTCHA Interactive Challenge Modal */}
      {showChallenge && (
        <div style={styles.modalBackdrop}>
          <div 
            style={{
              ...styles.challengeCard,
              animation: isShaking ? 'captchaShake 0.4s ease' : 'none'
            }}
          >
            {/* Header: Authentic Blue Banner */}
            <div style={styles.headerBanner}>
              <div style={styles.headerSubtitle}>
                {showCodeChallenge ? 'Security Check' : 'Select all squares with'}
              </div>
              <div style={styles.headerTitle}>
                {showCodeChallenge ? 'Type the characters' : currentChallenge.title}
              </div>
              <div style={styles.headerFootnote}>
                {showCodeChallenge ? 'Enter the text below to verify you are human' : 'Click verify once there are none left.'}
              </div>
            </div>

            {/* Error Message if wrong attempt */}
            {errorMsg && (
              <div style={styles.errorBanner}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Standard 3x3 Real Photo Grid */}
            {!showCodeChallenge ? (
              <div style={styles.gridContainer}>
                {shuffledTiles.map((tile, idx) => {
                  const isSelected = selectedTiles.includes(idx);
                  return (
                    <div
                      key={tile.id + '-' + idx}
                      onClick={() => toggleTile(idx)}
                      style={{
                        ...styles.tileBox,
                        border: isSelected ? '3px solid #1a73e8' : '2px solid rgba(255,255,255,0.08)',
                        transform: isSelected ? 'scale(0.92)' : 'scale(1)',
                      }}
                    >
                      <img 
                        src={tile.img} 
                        alt={tile.id} 
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                          userSelect: 'none',
                          pointerEvents: 'none'
                        }}
                        loading="eager"
                      />
                      {isSelected && (
                        <div style={styles.checkBadge}>
                          <Check size={14} color="#ffffff" strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Canvas Distorted Text Fallback */
              <div style={styles.codeContainer}>
                <canvas ref={canvasRef} width={160} height={50} style={styles.canvas} />
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter code"
                    value={userCodeInput}
                    onChange={(e) => setUserCodeInput(e.target.value.toUpperCase())}
                    style={styles.codeInput}
                    autoFocus
                  />
                  <button 
                    type="button" 
                    onClick={generateCanvasCode} 
                    style={styles.iconBtn}
                    title="Reload Code"
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div style={styles.modalFooter}>
              <div style={styles.footerControls}>
                <button 
                  type="button" 
                  onClick={showCodeChallenge ? generateCanvasCode : handleReload}
                  style={styles.iconBtn}
                  title="Reload new images"
                >
                  <RefreshCw size={20} />
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    const nextMode = !showCodeChallenge;
                    setShowCodeChallenge(nextMode);
                    if (nextMode) generateCanvasCode();
                  }}
                  style={{
                    ...styles.iconBtn,
                    color: showCodeChallenge ? '#3b82f6' : '#9ca3af'
                  }}
                  title={showCodeChallenge ? "Switch to image tiles" : "Switch to audio/text challenge"}
                >
                  <Volume2 size={20} />
                </button>
                <button 
                  type="button" 
                  onClick={() => alert("Please click each image tile matching the requested object, then press VERIFY.")}
                  style={styles.iconBtn}
                  title="Help & Info"
                >
                  <HelpCircle size={20} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowChallenge(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={showCodeChallenge ? handleVerifyCode : handleVerify}
                  style={styles.verifyBtn}
                >
                  VERIFY
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS keyframes for realistic shake and spinner */}
      <style>{`
        @keyframes captchaSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes captchaShake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  widgetContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    margin: '12px 0',
  },
  recaptchaBox: {
    width: '100%',
    maxWidth: '310px',
    height: '74px',
    backgroundColor: 'rgba(23, 27, 38, 0.85)',
    backdropFilter: 'blur(12px)',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 14px',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
    userSelect: 'none',
    transition: 'border-color 0.25s, box-shadow 0.25s',
  },
  leftSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  checkboxSquare: {
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    border: '2px solid #9ca3af',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease',
  },
  spinner: {
    width: '18px',
    height: '18px',
    border: '2.5px solid rgba(59, 130, 246, 0.25)',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    animation: 'captchaSpin 0.75s linear infinite',
  },
  checkboxLabel: {
    fontSize: '0.95rem',
    fontWeight: '500',
    color: '#e5e7eb',
    letterSpacing: '0.2px',
  },
  badgeSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.85,
  },
  badgeIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '2px',
  },
  badgeTitle: {
    fontSize: '0.62rem',
    fontWeight: '700',
    color: '#9ca3af',
    letterSpacing: '0.5px',
    lineHeight: 1,
  },
  badgeLinks: {
    fontSize: '0.55rem',
    color: '#6b7280',
    marginTop: '2px',
  },
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(5px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
    padding: '16px',
  },
  challengeCard: {
    width: '100%',
    maxWidth: '340px',
    backgroundColor: '#181b24',
    borderRadius: '8px',
    boxShadow: '0 20px 45px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  headerBanner: {
    backgroundColor: '#1a73e8',
    padding: '16px 18px',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: '0.85rem',
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '400',
    marginBottom: '2px',
  },
  headerTitle: {
    fontSize: '1.45rem',
    fontWeight: '800',
    textTransform: 'capitalize',
    letterSpacing: '0.5px',
    lineHeight: 1.2,
  },
  headerFootnote: {
    fontSize: '0.75rem',
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: '6px',
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.18)',
    color: '#fca5a5',
    fontSize: '0.78rem',
    padding: '8px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
  },
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '5px',
    padding: '8px',
    backgroundColor: '#0f1118',
  },
  tileBox: {
    aspectRatio: '1 / 1',
    borderRadius: '4px',
    overflow: 'hidden',
    cursor: 'pointer',
    position: 'relative',
    transition: 'transform 0.15s ease, border-color 0.15s ease',
    backgroundColor: '#1e293b',
  },
  checkBadge: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '20px',
    height: '20px',
    borderRadius: '50%',
    backgroundColor: '#1a73e8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.4)',
    zIndex: 2,
  },
  codeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '20px 16px',
    backgroundColor: '#0f1118',
  },
  canvas: {
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.15)',
  },
  codeInput: {
    flex: 1,
    padding: '10px 12px',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: '700',
    letterSpacing: '3px',
    textAlign: 'center',
    outline: 'none',
  },
  modalFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 14px',
    backgroundColor: '#181b24',
    borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  },
  footerControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  iconBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '4px',
    transition: 'color 0.2s',
  },
  cancelBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
    padding: '8px 12px',
  },
  verifyBtn: {
    backgroundColor: '#1a73e8',
    color: '#ffffff',
    border: 'none',
    borderRadius: '4px',
    padding: '9px 18px',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    boxShadow: '0 2px 6px rgba(26, 115, 232, 0.4)',
    transition: 'background-color 0.2s',
  },
};
