import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, RefreshCw, Volume2, HelpCircle, Check, AlertCircle } from 'lucide-react';

// Path resolver that handles any base URL, subpaths, and environments
export function getCaptchaUrl(imgPath) {
  if (!imgPath) return '';
  if (imgPath.startsWith('data:') || imgPath.startsWith('http://') || imgPath.startsWith('https://')) {
    return imgPath;
  }
  const clean = imgPath.replace(/^\.?\//, '');
  const base = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL) || './';
  const prefix = base.endsWith('/') ? base : `${base}/`;
  return `${prefix}${clean}`;
}

// Visual SVG fallback illustrations if photographic assets fail to load
function renderFallbackGraphic(type) {
  switch (type) {
    case 'airplane_1':
    case 'airplane_2':
    case 'airplane_3':
    case 'commercial_jet':
      return (
        <svg viewBox="0 0 100 100" style={styles.svgGraphic}>
          <defs>
            <linearGradient id="skyGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="60%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#bfdbfe" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#skyGrad1)" />
          <ellipse cx="20" cy="75" rx="30" ry="12" fill="rgba(255,255,255,0.7)" />
          <ellipse cx="85" cy="40" rx="25" ry="10" fill="rgba(255,255,255,0.5)" />
          <line x1="5" y1="70" x2="50" y2="48" stroke="rgba(255,255,255,0.5)" strokeWidth="3" strokeDasharray="3 2" />
          <path d="M25 65 Q 50 48 82 32 Q 86 30 84 34 Q 68 45 42 62 Z" fill="#ffffff" />
          <polygon points="50,47 62,25 68,26 58,45" fill="#e2e8f0" />
          <polygon points="38,58 35,74 41,75 48,55" fill="#cbd5e1" />
          <polygon points="26,64 20,53 23,52 30,62" fill="#94a3b8" />
        </svg>
      );
    case 'traffic_light_1':
    case 'traffic_light_2':
    case 'traffic_light_3':
    case 'traffic_light':
      return (
        <svg viewBox="0 0 100 100" style={styles.svgGraphic}>
          <rect width="100" height="100" fill="#334155" />
          <rect x="36" y="14" width="28" height="72" rx="6" fill="#0f172a" stroke="#475569" strokeWidth="2" />
          <circle cx="50" cy="28" r="8" fill="#ef4444" />
          <circle cx="50" cy="50" r="8" fill="#eab308" />
          <circle cx="50" cy="72" r="8" fill="#22c55e" />
          <circle cx="50" cy="28" r="4" fill="#fca5a5" opacity="0.6" />
        </svg>
      );
    case 'bicycle_1':
    case 'bicycle_2':
    case 'bicycle_3':
    case 'bicycle':
      return (
        <svg viewBox="0 0 100 100" style={styles.svgGraphic}>
          <rect width="100" height="100" fill="#047857" />
          <rect x="0" y="76" width="100" height="24" fill="#065f46" />
          <circle cx="28" cy="65" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
          <circle cx="72" cy="65" r="15" fill="none" stroke="#f1f5f9" strokeWidth="3" />
          <polyline points="28,65 46,65 60,45 38,45 28,65" fill="none" stroke="#38bdf8" strokeWidth="3.5" strokeLinejoin="round" />
          <line x1="46" y1="65" x2="42" y2="39" stroke="#38bdf8" strokeWidth="3.5" />
          <line x1="38" y1="39" x2="46" y2="39" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
          <line x1="72" y1="65" x2="63" y2="40" stroke="#38bdf8" strokeWidth="3.5" />
          <line x1="58" y1="36" x2="68" y2="36" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
        </svg>
      );
    case 'bus_1':
    case 'bus_2':
    case 'bus_3':
    case 'bus':
      return (
        <svg viewBox="0 0 100 100" style={styles.svgGraphic}>
          <rect width="100" height="100" fill="#38bdf8" />
          <rect x="0" y="78" width="100" height="22" fill="#475569" />
          <rect x="15" y="32" width="70" height="44" rx="4" fill="#dc2626" />
          <rect x="20" y="38" width="12" height="15" rx="2" fill="#e0f2fe" />
          <rect x="36" y="38" width="12" height="15" rx="2" fill="#e0f2fe" />
          <rect x="52" y="38" width="12" height="15" rx="2" fill="#e0f2fe" />
          <rect x="68" y="38" width="12" height="15" rx="2" fill="#e0f2fe" />
          <circle cx="32" cy="76" r="7" fill="#0f172a" />
          <circle cx="68" cy="76" r="7" fill="#0f172a" />
        </svg>
      );
    case 'crosswalk_1':
    case 'crosswalk_2':
    case 'crosswalk_3':
    case 'crosswalk':
      return (
        <svg viewBox="0 0 100 100" style={styles.svgGraphic}>
          <rect width="100" height="100" fill="#334155" />
          <polygon points="10,95 24,95 38,15 28,15" fill="#f8fafc" />
          <polygon points="32,95 46,95 56,15 46,15" fill="#f8fafc" />
          <polygon points="54,95 68,95 74,15 64,15" fill="#f8fafc" />
          <polygon points="76,95 90,95 92,15 82,15" fill="#f8fafc" />
        </svg>
      );
    case 'decoy_mountain':
      return (
        <svg viewBox="0 0 100 100" style={styles.svgGraphic}>
          <rect width="100" height="100" fill="#bae6fd" />
          <polygon points="10,85 45,30 80,85" fill="#64748b" />
          <polygon points="45,30 55,46 45,52 35,46" fill="#ffffff" />
          <polygon points="45,85 75,45 95,85" fill="#475569" />
          <polygon points="75,45 82,56 75,60 68,56" fill="#ffffff" />
        </svg>
      );
    case 'decoy_forest':
      return (
        <svg viewBox="0 0 100 100" style={styles.svgGraphic}>
          <rect width="100" height="100" fill="#a7f3d0" />
          <rect x="30" y="65" width="8" height="25" fill="#78350f" />
          <polygon points="34,25 18,65 50,65" fill="#047857" />
          <rect x="65" y="55" width="8" height="35" fill="#78350f" />
          <polygon points="69,20 52,58 86,58" fill="#065f46" />
        </svg>
      );
    case 'decoy_coffee':
      return (
        <svg viewBox="0 0 100 100" style={styles.svgGraphic}>
          <rect width="100" height="100" fill="#fed7aa" />
          <ellipse cx="50" cy="75" rx="30" ry="10" fill="#ea580c" opacity="0.3" />
          <path d="M30 35 L 35 70 Q 50 78 65 70 L 70 35 Z" fill="#ffffff" stroke="#9a3412" strokeWidth="2" />
          <path d="M70 42 Q 85 42 85 55 Q 85 65 67 65" fill="none" stroke="#9a3412" strokeWidth="3" />
          <ellipse cx="50" cy="35" rx="20" ry="6" fill="#78350f" />
        </svg>
      );
    case 'decoy_dog':
    default:
      return (
        <svg viewBox="0 0 100 100" style={styles.svgGraphic}>
          <rect width="100" height="100" fill="#fef08a" />
          <circle cx="50" cy="50" r="26" fill="#d97706" />
          <polygon points="32,32 25,12 40,25" fill="#b45309" />
          <polygon points="68,32 75,12 60,25" fill="#b45309" />
          <circle cx="42" cy="48" r="4" fill="#0f172a" />
          <circle cx="58" cy="48" r="4" fill="#0f172a" />
          <ellipse cx="50" cy="58" rx="6" ry="4" fill="#0f172a" />
        </svg>
      );
  }
}

// 5 crystal-clear challenges. Exactly 3 distinct targets per challenge.
// Decoys are clearly non-conflicting nature/object scenes so users never get confused.
const CHALLENGES = [
  {
    id: 'airplanes',
    title: 'airplanes',
    instruction: 'Select all squares with airplanes',
    requiredCount: 3,
    tiles: [
      { id: 'plane_1', isTarget: true, img: 'captcha/airplanes/1.jpg', fallback: 'airplane_1' },
      { id: 'decoy_m1', isTarget: false, img: 'captcha/decoys/3.jpg', fallback: 'decoy_mountain' },
      { id: 'plane_2', isTarget: true, img: 'captcha/airplanes/2.jpg', fallback: 'airplane_2' },
      { id: 'decoy_f1', isTarget: false, img: 'captcha/decoys/4.jpg', fallback: 'decoy_forest' },
      { id: 'decoy_c1', isTarget: false, img: 'captcha/decoys/6.jpg', fallback: 'decoy_coffee' },
      { id: 'plane_3', isTarget: true, img: 'captcha/airplanes/3.jpg', fallback: 'airplane_3' },
      { id: 'decoy_d1', isTarget: false, img: 'captcha/decoys/7.jpg', fallback: 'decoy_dog' },
      { id: 'decoy_m2', isTarget: false, img: 'captcha/decoys/5.jpg', fallback: 'decoy_mountain' },
      { id: 'decoy_f2', isTarget: false, img: 'captcha/bicycles/1.jpg', fallback: 'bicycle' },
    ]
  },
  {
    id: 'traffic_lights',
    title: 'traffic lights',
    instruction: 'Select all squares with traffic lights',
    requiredCount: 3,
    tiles: [
      { id: 'tl_1', isTarget: true, img: 'captcha/traffic_lights/1.jpg', fallback: 'traffic_light_1' },
      { id: 'decoy_m1', isTarget: false, img: 'captcha/decoys/3.jpg', fallback: 'decoy_mountain' },
      { id: 'tl_2', isTarget: true, img: 'captcha/traffic_lights/2.jpg', fallback: 'traffic_light_2' },
      { id: 'decoy_c1', isTarget: false, img: 'captcha/decoys/6.jpg', fallback: 'decoy_coffee' },
      { id: 'tl_3', isTarget: true, img: 'captcha/traffic_lights/3.jpg', fallback: 'traffic_light_3' },
      { id: 'decoy_d1', isTarget: false, img: 'captcha/decoys/7.jpg', fallback: 'decoy_dog' },
      { id: 'decoy_f1', isTarget: false, img: 'captcha/decoys/4.jpg', fallback: 'decoy_forest' },
      { id: 'decoy_p1', isTarget: false, img: 'captcha/airplanes/1.jpg', fallback: 'commercial_jet' },
      { id: 'decoy_m2', isTarget: false, img: 'captcha/decoys/5.jpg', fallback: 'decoy_mountain' },
    ]
  },
  {
    id: 'bicycles',
    title: 'bicycles',
    instruction: 'Select all squares with bicycles',
    requiredCount: 3,
    tiles: [
      { id: 'bike_1', isTarget: true, img: 'captcha/bicycles/1.jpg', fallback: 'bicycle_1' },
      { id: 'decoy_c1', isTarget: false, img: 'captcha/decoys/6.jpg', fallback: 'decoy_coffee' },
      { id: 'bike_2', isTarget: true, img: 'captcha/bicycles/2.jpg', fallback: 'bicycle_2' },
      { id: 'decoy_m1', isTarget: false, img: 'captcha/decoys/3.jpg', fallback: 'decoy_mountain' },
      { id: 'decoy_d1', isTarget: false, img: 'captcha/decoys/7.jpg', fallback: 'decoy_dog' },
      { id: 'bike_3', isTarget: true, img: 'captcha/bicycles/3.jpg', fallback: 'bicycle_3' },
      { id: 'decoy_f1', isTarget: false, img: 'captcha/decoys/4.jpg', fallback: 'decoy_forest' },
      { id: 'decoy_p1', isTarget: false, img: 'captcha/airplanes/2.jpg', fallback: 'commercial_jet' },
      { id: 'decoy_m2', isTarget: false, img: 'captcha/decoys/5.jpg', fallback: 'decoy_mountain' },
    ]
  },
  {
    id: 'buses',
    title: 'buses',
    instruction: 'Select all squares with buses',
    requiredCount: 3,
    tiles: [
      { id: 'bus_1', isTarget: true, img: 'captcha/buses/1.jpg', fallback: 'bus_1' },
      { id: 'decoy_d1', isTarget: false, img: 'captcha/decoys/7.jpg', fallback: 'decoy_dog' },
      { id: 'bus_2', isTarget: true, img: 'captcha/buses/2.jpg', fallback: 'bus_2' },
      { id: 'decoy_c1', isTarget: false, img: 'captcha/decoys/6.jpg', fallback: 'decoy_coffee' },
      { id: 'bus_3', isTarget: true, img: 'captcha/buses/3.jpg', fallback: 'bus_3' },
      { id: 'decoy_m1', isTarget: false, img: 'captcha/decoys/3.jpg', fallback: 'decoy_mountain' },
      { id: 'decoy_f1', isTarget: false, img: 'captcha/decoys/4.jpg', fallback: 'decoy_forest' },
      { id: 'decoy_b1', isTarget: false, img: 'captcha/bicycles/3.jpg', fallback: 'bicycle' },
      { id: 'decoy_m2', isTarget: false, img: 'captcha/decoys/5.jpg', fallback: 'decoy_mountain' },
    ]
  },
  {
    id: 'crosswalks',
    title: 'crosswalks',
    instruction: 'Select all squares with crosswalks',
    requiredCount: 3,
    tiles: [
      { id: 'cw_1', isTarget: true, img: 'captcha/crosswalks/1.jpg', fallback: 'crosswalk_1' },
      { id: 'decoy_c1', isTarget: false, img: 'captcha/decoys/6.jpg', fallback: 'decoy_coffee' },
      { id: 'cw_2', isTarget: true, img: 'captcha/crosswalks/2.jpg', fallback: 'crosswalk_2' },
      { id: 'decoy_m1', isTarget: false, img: 'captcha/decoys/3.jpg', fallback: 'decoy_mountain' },
      { id: 'decoy_d1', isTarget: false, img: 'captcha/decoys/7.jpg', fallback: 'decoy_dog' },
      { id: 'cw_3', isTarget: true, img: 'captcha/crosswalks/3.jpg', fallback: 'crosswalk_3' },
      { id: 'decoy_f1', isTarget: false, img: 'captcha/decoys/4.jpg', fallback: 'decoy_forest' },
      { id: 'decoy_p1', isTarget: false, img: 'captcha/airplanes/3.jpg', fallback: 'commercial_jet' },
      { id: 'decoy_m2', isTarget: false, img: 'captcha/decoys/5.jpg', fallback: 'decoy_mountain' },
    ]
  }
];

export default function Captcha({ onVerify, verified = false, onReset }) {
  const [isChecked, setIsChecked] = useState(verified);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showChallenge, setShowChallenge] = useState(false);
  const [challengeIdx, setChallengeIdx] = useState(0);
  const [selectedTileIds, setSelectedTileIds] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');
  const [isShaking, setIsShaking] = useState(false);
  const [shuffledTiles, setShuffledTiles] = useState([]);
  const [failedImages, setFailedImages] = useState({});

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
    // Fisher-Yates shuffle
    for (let i = tilesCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tilesCopy[i], tilesCopy[j]] = [tilesCopy[j], tilesCopy[i]];
    }
    setShuffledTiles(tilesCopy);
    setSelectedTileIds([]);
    setErrorMsg('');
    setFailedImages({});
  }, []);

  // Sync external verified state
  useEffect(() => {
    setIsChecked(verified);
  }, [verified]);

  // Generate canvas distorted text for alternative code challenge
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

    // Realistic behavior: click checkbox -> spinner for 450ms -> open challenge modal
    setTimeout(() => {
      setIsVerifying(false);
      const nextIdx = Math.floor(Math.random() * CHALLENGES.length);
      setChallengeIdx(nextIdx);
      initChallenge(nextIdx);
      setShowChallenge(true);
    }, 450);
  };

  const toggleTile = (tileId) => {
    setSelectedTileIds(prev => 
      prev.includes(tileId) ? prev.filter(id => id !== tileId) : [...prev, tileId]
    );
    setErrorMsg('');
  };

  const handleImageError = (tileId) => {
    setFailedImages(prev => ({ ...prev, [tileId]: true }));
  };

  const handleVerify = () => {
    const targetTileIds = shuffledTiles
      .filter(t => t.isTarget)
      .map(t => t.id);

    const isMatch = 
      targetTileIds.length === selectedTileIds.length &&
      targetTileIds.every(id => selectedTileIds.includes(id));

    if (isMatch) {
      setShowChallenge(false);
      setIsChecked(true);
      setErrorMsg('');
      if (onVerify) onVerify(true);
    } else {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 450);

      const required = currentChallenge.requiredCount || 3;
      if (selectedTileIds.length === 0) {
        setErrorMsg(`Please select the ${required} matching squares first.`);
      } else if (selectedTileIds.length !== required) {
        setErrorMsg(`Please select exactly ${required} squares. You currently have ${selectedTileIds.length} selected.`);
      } else {
        setErrorMsg(`Some selections were incorrect. Please check and try again.`);
      }
    }
  };

  const handleVerifyCode = () => {
    if (userCodeInput.trim().toUpperCase() === canvasCode) {
      setShowChallenge(false);
      setShowCodeChallenge(false);
      setIsChecked(true);
      setErrorMsg('');
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

  const handleCancel = () => {
    setShowChallenge(false);
    setSelectedTileIds([]);
    setErrorMsg('');
    if (onReset) onReset();
  };

  const requiredCount = currentChallenge.requiredCount || 3;

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
                {showCodeChallenge 
                  ? 'Enter the 5 characters below' 
                  : `Select all ${requiredCount} matching squares (${selectedTileIds.length}/${requiredCount} selected)`}
              </div>
            </div>

            {/* Error Message if wrong attempt */}
            {errorMsg && (
              <div style={styles.errorBanner}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Standard 3x3 Real Photo Grid with Instant SVG Fallback */}
            {!showCodeChallenge ? (
              <div style={styles.gridContainer}>
                {shuffledTiles.map((tile, idx) => {
                  const isSelected = selectedTileIds.includes(tile.id);
                  const isFailed = failedImages[tile.id];

                  return (
                    <div
                      key={tile.id + '-' + idx}
                      onClick={() => toggleTile(tile.id)}
                      style={{
                        ...styles.tileBox,
                        border: isSelected ? '3px solid #1a73e8' : '2px solid rgba(255,255,255,0.08)',
                        transform: isSelected ? 'scale(0.92)' : 'scale(1)',
                      }}
                      title={tile.id}
                    >
                      {!isFailed ? (
                        <img 
                          src={getCaptchaUrl(tile.img)} 
                          alt={tile.id} 
                          onError={() => handleImageError(tile.id)}
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
                      ) : (
                        renderFallbackGraphic(tile.fallback)
                      )}

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
                  title="New Challenge (Skip)"
                >
                  <RefreshCw size={19} />
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
                  title={showCodeChallenge ? "Switch to image tiles" : "Switch to text challenge"}
                >
                  <Volume2 size={19} />
                </button>
                <button 
                  type="button" 
                  onClick={() => alert(`Please click all ${requiredCount} squares matching "${currentChallenge.title}". Once you have selected ${requiredCount}, press VERIFY.`)}
                  style={styles.iconBtn}
                  title="Help & Info"
                >
                  <HelpCircle size={19} />
                </button>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={handleCancel}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={showCodeChallenge ? handleVerifyCode : handleVerify}
                  style={{
                    ...styles.verifyBtn,
                    opacity: (!showCodeChallenge && selectedTileIds.length !== requiredCount) ? 0.8 : 1,
                  }}
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
    fontSize: '0.78rem',
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: '6px',
    fontWeight: '500',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgGraphic: {
    width: '100%',
    height: '100%',
    display: 'block',
    userSelect: 'none',
    pointerEvents: 'none',
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
    transition: 'background-color 0.2s, opacity 0.2s',
  },
};
