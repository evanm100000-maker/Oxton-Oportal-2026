import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, RefreshCw, Volume2, HelpCircle, Check, AlertCircle } from 'lucide-react';

// Pre-defined visual challenges with realistic SVG illustrations
const CHALLENGES = [
  {
    id: 'airplanes',
    title: 'airplanes',
    instruction: 'Select all squares with airplanes',
    tiles: [
      { id: 'a1', isTarget: true, type: 'commercial_jet' },
      { id: 'd1', isTarget: false, type: 'car' },
      { id: 'a2', isTarget: true, type: 'airplane_runway' },
      { id: 'd2', isTarget: false, type: 'city_bus' },
      { id: 'a3', isTarget: true, type: 'supersonic_jet' },
      { id: 'd3', isTarget: false, type: 'traffic_light' },
      { id: 'd4', isTarget: false, type: 'boat' },
      { id: 'a4', isTarget: true, type: 'propeller_plane' },
      { id: 'd5', isTarget: false, type: 'bicycle' },
    ]
  },
  {
    id: 'traffic_lights',
    title: 'traffic lights',
    instruction: 'Select all squares with traffic lights',
    tiles: [
      { id: 'tl1', isTarget: true, type: 'traffic_light_red' },
      { id: 'd1', isTarget: false, type: 'car' },
      { id: 'tl2', isTarget: true, type: 'traffic_light_green' },
      { id: 'd2', isTarget: false, type: 'commercial_jet' },
      { id: 'd3', isTarget: false, type: 'bicycle' },
      { id: 'tl3', isTarget: true, type: 'traffic_light_yellow' },
      { id: 'd4', isTarget: false, type: 'city_bus' },
      { id: 'tl4', isTarget: true, type: 'traffic_light_overhead' },
      { id: 'd5', isTarget: false, type: 'crosswalk' },
    ]
  },
  {
    id: 'bicycles',
    title: 'bicycles',
    instruction: 'Select all squares with bicycles',
    tiles: [
      { id: 'b1', isTarget: true, type: 'bicycle' },
      { id: 'd1', isTarget: false, type: 'commercial_jet' },
      { id: 'd2', isTarget: false, type: 'traffic_light_red' },
      { id: 'b2', isTarget: true, type: 'mountain_bike' },
      { id: 'd3', isTarget: false, type: 'car' },
      { id: 'b3', isTarget: true, type: 'road_bike' },
      { id: 'd4', isTarget: false, type: 'city_bus' },
      { id: 'd5', isTarget: false, type: 'crosswalk' },
      { id: 'b4', isTarget: true, type: 'vintage_bike' },
    ]
  },
  {
    id: 'crosswalks',
    title: 'crosswalks',
    instruction: 'Select all squares with crosswalks',
    tiles: [
      { id: 'cw1', isTarget: true, type: 'crosswalk' },
      { id: 'd1', isTarget: false, type: 'traffic_light_green' },
      { id: 'cw2', isTarget: true, type: 'crosswalk_perspective' },
      { id: 'd2', isTarget: false, type: 'car' },
      { id: 'd3', isTarget: false, type: 'bicycle' },
      { id: 'cw3', isTarget: true, type: 'crosswalk_night' },
      { id: 'd4', isTarget: false, type: 'commercial_jet' },
      { id: 'cw4', isTarget: true, type: 'crosswalk_urban' },
      { id: 'd5', isTarget: false, type: 'city_bus' },
    ]
  },
  {
    id: 'buses',
    title: 'buses',
    instruction: 'Select all squares with buses',
    tiles: [
      { id: 'bu1', isTarget: true, type: 'city_bus' },
      { id: 'd1', isTarget: false, type: 'car' },
      { id: 'bu2', isTarget: true, type: 'double_decker_bus' },
      { id: 'd2', isTarget: false, type: 'traffic_light_red' },
      { id: 'd3', isTarget: false, type: 'commercial_jet' },
      { id: 'bu3', isTarget: true, type: 'school_bus' },
      { id: 'd4', isTarget: false, type: 'crosswalk' },
      { id: 'bu4', isTarget: true, type: 'transit_bus' },
      { id: 'd5', isTarget: false, type: 'bicycle' },
    ]
  }
];

// Rich, high-fidelity SVG graphics for realistic photographic style tiles
function renderTileGraphic(type) {
  switch (type) {
    case 'commercial_jet':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <linearGradient id="skyGrad1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1e3a8a" />
              <stop offset="60%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#bfdbfe" />
            </linearGradient>
            <linearGradient id="planeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f8fafc" />
              <stop offset="50%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>
          </defs>
          <rect width="100" height="100" fill="url(#skyGrad1)" />
          {/* Cloud drifts */}
          <ellipse cx="20" cy="75" rx="30" ry="12" fill="rgba(255,255,255,0.7)" filter="blur(1px)" />
          <ellipse cx="85" cy="40" rx="25" ry="10" fill="rgba(255,255,255,0.5)" filter="blur(1px)" />
          {/* Contrail */}
          <line x1="5" y1="70" x2="50" y2="48" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeDasharray="3 2" />
          {/* Jet Body */}
          <path d="M25 65 Q 50 48 82 32 Q 86 30 84 34 Q 68 45 42 62 Z" fill="url(#planeGrad)" />
          {/* Tail Fin */}
          <polygon points="26,64 35,42 42,47 32,65" fill="#2563eb" />
          {/* Main Wing */}
          <polygon points="46,51 68,66 60,69 40,56" fill="#64748b" />
          {/* Cockpit windows */}
          <circle cx="80" cy="33" r="1.5" fill="#0f172a" />
          <circle cx="78" cy="34" r="1.5" fill="#0f172a" />
        </svg>
      );

    case 'airplane_runway':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <defs>
            <linearGradient id="tarmac" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>
          </defs>
          <rect width="100" height="55" fill="#38bdf8" />
          <rect y="55" width="100" height="45" fill="url(#tarmac)" />
          {/* Centerline */}
          <line x1="10" y1="78" x2="35" y2="78" stroke="#facc15" strokeWidth="3" />
          <line x1="50" y1="78" x2="75" y2="78" stroke="#facc15" strokeWidth="3" />
          <line x1="90" y1="78" x2="100" y2="78" stroke="#facc15" strokeWidth="3" />
          {/* Airplane on runway */}
          <ellipse cx="50" cy="53" rx="28" ry="7" fill="#f8fafc" />
          <polygon points="45,46 55,46 50,32" fill="#ef4444" />
          <polygon points="35,53 15,62 25,65 42,55" fill="#94a3b8" />
          <polygon points="65,53 85,62 75,65 58,55" fill="#94a3b8" />
        </svg>
      );

    case 'supersonic_jet':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#0284c7" />
          <polygon points="15,85 85,15 85,18 35,85" fill="#f1f5f9" />
          <polygon points="45,55 30,85 65,80" fill="#cbd5e1" />
          <polygon points="80,18 85,15 78,24" fill="#0369a1" />
          <line x1="10" y1="90" x2="30" y2="82" stroke="#f97316" strokeWidth="4" />
        </svg>
      );

    case 'propeller_plane':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#7dd3fc" />
          <path d="M20 50 Q 55 42 75 50 Q 55 58 20 50" fill="#dc2626" />
          <polygon points="40,48 55,20 62,22 48,49" fill="#f8fafc" />
          <line x1="75" y1="35" x2="75" y2="65" stroke="#475569" strokeWidth="3" />
          <circle cx="75" cy="50" r="3" fill="#1e293b" />
        </svg>
      );

    case 'traffic_light_red':
    case 'traffic_light':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#475569" />
          {/* Post */}
          <rect x="47" y="65" width="6" height="35" fill="#1e293b" />
          {/* Light Box */}
          <rect x="36" y="15" width="28" height="54" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          {/* Red Glowing Lamp */}
          <circle cx="50" cy="26" r="7" fill="#ef4444" filter="drop-shadow(0 0 6px #ef4444)" />
          {/* Yellow Dim */}
          <circle cx="50" cy="42" r="6" fill="#713f12" opacity="0.6" />
          {/* Green Dim */}
          <circle cx="50" cy="58" r="6" fill="#064e3b" opacity="0.6" />
        </svg>
      );

    case 'traffic_light_green':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#64748b" />
          <rect x="47" y="65" width="6" height="35" fill="#0f172a" />
          <rect x="36" y="15" width="28" height="54" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <circle cx="50" cy="26" r="6" fill="#7f1d1d" opacity="0.6" />
          <circle cx="50" cy="42" r="6" fill="#713f12" opacity="0.6" />
          <circle cx="50" cy="58" r="7" fill="#22c55e" filter="drop-shadow(0 0 6px #22c55e)" />
        </svg>
      );

    case 'traffic_light_yellow':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#475569" />
          <rect x="47" y="65" width="6" height="35" fill="#0f172a" />
          <rect x="36" y="15" width="28" height="54" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="2" />
          <circle cx="50" cy="26" r="6" fill="#7f1d1d" opacity="0.6" />
          <circle cx="50" cy="42" r="7" fill="#eab308" filter="drop-shadow(0 0 6px #eab308)" />
          <circle cx="50" cy="58" r="6" fill="#064e3b" opacity="0.6" />
        </svg>
      );

    case 'traffic_light_overhead':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#334155" />
          {/* Horizontal Gantry Pole */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#94a3b8" strokeWidth="4" />
          {/* Hanging Light Box */}
          <rect x="40" y="30" width="20" height="42" rx="3" fill="#020617" />
          <circle cx="50" cy="38" r="4.5" fill="#ef4444" filter="drop-shadow(0 0 4px #ef4444)" />
          <circle cx="50" cy="51" r="4" fill="#713f12" opacity="0.5" />
          <circle cx="50" cy="63" r="4" fill="#064e3b" opacity="0.5" />
        </svg>
      );

    case 'bicycle':
    case 'road_bike':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#e2e8f0" />
          {/* Road */}
          <line x1="0" y1="85" x2="100" y2="85" stroke="#94a3b8" strokeWidth="4" />
          {/* Wheels */}
          <circle cx="26" cy="68" r="16" fill="none" stroke="#0f172a" strokeWidth="3" />
          <circle cx="74" cy="68" r="16" fill="none" stroke="#0f172a" strokeWidth="3" />
          <circle cx="26" cy="68" r="3" fill="#475569" />
          <circle cx="74" cy="68" r="3" fill="#475569" />
          {/* Bike Frame */}
          <polygon points="26,68 50,68 66,46 42,46" fill="none" stroke="#2563eb" strokeWidth="3.5" strokeLinejoin="round" />
          <line x1="50" y1="68" x2="42" y2="40" stroke="#2563eb" strokeWidth="3.5" />
          <line x1="74" y1="68" x2="66" y2="46" stroke="#2563eb" strokeWidth="3.5" />
          {/* Seat & Handlebars */}
          <line x1="38" y1="40" x2="46" y2="40" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
          <line x1="64" y1="42" x2="70" y2="42" stroke="#0f172a" strokeWidth="3.5" strokeLinecap="round" />
        </svg>
      );

    case 'mountain_bike':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#fed7aa" />
          <line x1="0" y1="85" x2="100" y2="85" stroke="#78350f" strokeWidth="6" />
          <circle cx="26" cy="66" r="17" fill="none" stroke="#1c1917" strokeWidth="4" strokeDasharray="3 1" />
          <circle cx="74" cy="66" r="17" fill="none" stroke="#1c1917" strokeWidth="4" strokeDasharray="3 1" />
          <polygon points="26,66 50,66 65,46 41,46" fill="none" stroke="#16a34a" strokeWidth="4" />
          <line x1="50" y1="66" x2="41" y2="39" stroke="#16a34a" strokeWidth="4" />
          <line x1="74" y1="66" x2="65" y2="46" stroke="#16a34a" strokeWidth="4" />
        </svg>
      );

    case 'vintage_bike':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#fef08a" />
          <circle cx="28" cy="66" r="16" fill="none" stroke="#1e293b" strokeWidth="3" />
          <circle cx="72" cy="66" r="16" fill="none" stroke="#1e293b" strokeWidth="3" />
          <polygon points="28,66 50,66 64,46 42,46" fill="none" stroke="#ea580c" strokeWidth="3" />
          <line x1="50" y1="66" x2="42" y2="42" stroke="#ea580c" strokeWidth="3" />
          <line x1="72" y1="66" x2="64" y2="46" stroke="#ea580c" strokeWidth="3" />
          {/* Front basket */}
          <rect x="66" y="38" width="10" height="8" fill="#d97706" rx="1" />
        </svg>
      );

    case 'crosswalk':
    case 'crosswalk_perspective':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#1e293b" />
          {/* Perspective zebra lines */}
          <polygon points="12,95 24,95 32,25 24,25" fill="#f8fafc" />
          <polygon points="34,95 46,95 48,25 40,25" fill="#f8fafc" />
          <polygon points="56,95 68,95 64,25 56,25" fill="#f8fafc" />
          <polygon points="78,95 90,95 80,25 72,25" fill="#f8fafc" />
          {/* Sidewalk curb */}
          <rect x="0" y="15" width="100" height="10" fill="#64748b" />
        </svg>
      );

    case 'crosswalk_night':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#090d16" />
          <line x1="20" y1="85" x2="20" y2="20" stroke="#f1f5f9" strokeWidth="8" strokeDasharray="14 10" opacity="0.8" />
          <line x1="45" y1="85" x2="45" y2="20" stroke="#f1f5f9" strokeWidth="8" strokeDasharray="14 10" opacity="0.8" />
          <line x1="70" y1="85" x2="70" y2="20" stroke="#f1f5f9" strokeWidth="8" strokeDasharray="14 10" opacity="0.8" />
          <line x1="95" y1="85" x2="95" y2="20" stroke="#f1f5f9" strokeWidth="8" strokeDasharray="14 10" opacity="0.8" />
        </svg>
      );

    case 'crosswalk_urban':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#334155" />
          <polygon points="10,90 26,90 34,30 22,30" fill="#ffffff" />
          <polygon points="38,90 54,90 56,30 44,30" fill="#ffffff" />
          <polygon points="66,90 82,90 78,30 66,30" fill="#ffffff" />
        </svg>
      );

    case 'city_bus':
    case 'transit_bus':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#93c5fd" />
          <rect x="0" y="80" width="100" height="20" fill="#334155" />
          {/* Bus body */}
          <rect x="15" y="32" width="70" height="42" rx="6" fill="#2563eb" />
          {/* Windows */}
          <rect x="20" y="38" width="12" height="14" rx="2" fill="#e0f2fe" />
          <rect x="36" y="38" width="12" height="14" rx="2" fill="#e0f2fe" />
          <rect x="52" y="38" width="12" height="14" rx="2" fill="#e0f2fe" />
          <rect x="68" y="38" width="12" height="14" rx="2" fill="#e0f2fe" />
          {/* Bus Wheels */}
          <circle cx="32" cy="74" r="8" fill="#0f172a" />
          <circle cx="32" cy="74" r="3" fill="#cbd5e1" />
          <circle cx="68" cy="74" r="8" fill="#0f172a" />
          <circle cx="68" cy="74" r="3" fill="#cbd5e1" />
        </svg>
      );

    case 'double_decker_bus':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#cbd5e1" />
          <rect x="0" y="85" width="100" height="15" fill="#1e293b" />
          {/* Red Body */}
          <rect x="18" y="20" width="64" height="60" rx="4" fill="#dc2626" />
          {/* Top Floor Windows */}
          <rect x="24" y="26" width="10" height="12" fill="#f1f5f9" />
          <rect x="38" y="26" width="10" height="12" fill="#f1f5f9" />
          <rect x="52" y="26" width="10" height="12" fill="#f1f5f9" />
          <rect x="66" y="26" width="10" height="12" fill="#f1f5f9" />
          {/* Bottom Floor Windows */}
          <rect x="24" y="46" width="10" height="14" fill="#f1f5f9" />
          <rect x="38" y="46" width="10" height="14" fill="#f1f5f9" />
          <rect x="52" y="46" width="10" height="14" fill="#f1f5f9" />
          <rect x="66" y="46" width="10" height="14" fill="#f1f5f9" />
          {/* Wheels */}
          <circle cx="32" cy="80" r="7" fill="#0f172a" />
          <circle cx="68" cy="80" r="7" fill="#0f172a" />
        </svg>
      );

    case 'school_bus':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#bae6fd" />
          <rect x="0" y="80" width="100" height="20" fill="#475569" />
          <rect x="12" y="34" width="76" height="40" rx="5" fill="#facc15" />
          <line x1="12" y1="56" x2="88" y2="56" stroke="#0f172a" strokeWidth="3" />
          <rect x="18" y="40" width="10" height="12" fill="#1e293b" />
          <rect x="32" y="40" width="10" height="12" fill="#1e293b" />
          <rect x="46" y="40" width="10" height="12" fill="#1e293b" />
          <rect x="60" y="40" width="10" height="12" fill="#1e293b" />
          <circle cx="28" cy="74" r="8" fill="#0f172a" />
          <circle cx="72" cy="74" r="8" fill="#0f172a" />
        </svg>
      );

    case 'car':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#e2e8f0" />
          <rect x="0" y="78" width="100" height="22" fill="#64748b" />
          <path d="M15 68 L 25 50 L 55 50 L 70 60 L 85 64 L 85 72 L 15 72 Z" fill="#ef4444" />
          <polygon points="28,53 52,53 52,62 25,62" fill="#38bdf8" />
          <circle cx="32" cy="72" r="7" fill="#0f172a" />
          <circle cx="70" cy="72" r="7" fill="#0f172a" />
        </svg>
      );

    case 'boat':
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="60" fill="#7dd3fc" />
          <rect y="60" width="100" height="40" fill="#0284c7" />
          <polygon points="20,68 80,68 70,80 30,80" fill="#f8fafc" />
          <polygon points="50,25 50,62 70,62" fill="#ffffff" stroke="#cbd5e1" />
          <line x1="50" y1="20" x2="50" y2="65" stroke="#475569" strokeWidth="2.5" />
        </svg>
      );

    default:
      return (
        <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%', display: 'block' }}>
          <rect width="100" height="100" fill="#334155" />
          <circle cx="50" cy="50" r="18" fill="#475569" />
        </svg>
      );
  }
}

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

    // Authentic behavior: click checkbox -> show spinner for 600ms -> open challenge modal
    setTimeout(() => {
      setIsVerifying(false);
      const nextIdx = Math.floor(Math.random() * CHALLENGES.length);
      setChallengeIdx(nextIdx);
      initChallenge(nextIdx);
      setShowChallenge(true);
    }, 600);
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

            {/* Standard 3x3 Photo Grid */}
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
                      {renderTileGraphic(tile.type)}
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
