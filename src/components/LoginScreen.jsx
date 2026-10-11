import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { LogIn, UserPlus, Key, Mail, User, ShieldAlert, Award, ChevronLeft, Eye, EyeOff, Plane, Star, Heart, Cloud, Moon, Sun, Camera, Bell, Zap } from 'lucide-react';

export default function LoginScreen({ onBack }) {
  const { login, signup, requestPasswordReset } = useApp();
  const [rememberMe, setRememberMe] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Captcha state
  const allIcons = ['Plane', 'Star', 'Heart', 'Cloud', 'Moon', 'Sun', 'Camera', 'Bell', 'Zap'];
  const [captchaTarget, setCaptchaTarget] = useState('Plane');
  const [captchaGrid, setCaptchaGrid] = useState([]);
  const [selectedCaptchaIndices, setSelectedCaptchaIndices] = useState([]);

  const regenerateCaptcha = React.useCallback(() => {
    const target = 'Plane'; // For simplicity, we always ask for Plane, but we can randomize target too
    setCaptchaTarget(target);
    const newGrid = [];
    const targetCount = Math.floor(Math.random() * 3) + 2; // 2 to 4 planes
    for (let i = 0; i < 9; i++) {
      newGrid.push(i < targetCount ? target : allIcons[Math.floor(Math.random() * (allIcons.length - 1)) + 1]);
    }
    // Shuffle
    for (let i = newGrid.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newGrid[i], newGrid[j]] = [newGrid[j], newGrid[i]];
    }
    setCaptchaGrid(newGrid);
    setSelectedCaptchaIndices([]);
  }, []);

  React.useEffect(() => {
    regenerateCaptcha();
  }, [regenerateCaptcha]);

  const toggleCaptchaSelection = (index) => {
    setSelectedCaptchaIndices(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  };

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [robloxUsername, setRobloxUsername] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const isCaptchaValid = 
      captchaGrid.filter((_, i) => selectedCaptchaIndices.includes(i)).every(icon => icon === captchaTarget) &&
      captchaGrid.filter(icon => icon === captchaTarget).length === selectedCaptchaIndices.length;

    if (!isCaptchaValid) {
      setError('Captcha failed. Please select all ' + captchaTarget + 's.');
      regenerateCaptcha();
      setLoading(false);
      return;
    }

    try {
      if (isForgotPassword) {
        if (!email) throw new Error('Please enter your email address.');
        await requestPasswordReset(email);
        setSuccess('Password reset request sent. Please message vortex23575 (Jamie) on Discord.');
        setIsForgotPassword(false);
      } else if (isLogin) {
        await login(email, password, rememberMe);
      } else {
        if (!firstName || !robloxUsername || !email || !password) {
          throw new Error('Please fill in all fields.');
        }
        await signup({ email, password, firstName, lastName, robloxUsername });
        setSuccess('Registration successful! Your account is pending admin approval.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div className="glass-panel-glow" style={styles.card}>
        {onBack && (
          <button 
            onClick={onBack}
            style={styles.backButton}
            type="button"
          >
            <ChevronLeft size={20} />
            Back to Portal
          </button>
        )}
        
        <div style={styles.logoSection}>
          <div style={styles.logoIconContainer}>
            <img src="./logo.png" alt="Oxton Logo" style={styles.logoIcon} />
          </div>
          <h1 style={styles.brandTitle}>Oxton Oportal <span style={{ fontFamily: 'monospace', fontSize: '0.4em', color: '#60a5fa', verticalAlign: 'super', fontWeight: 'bold' }}>BETA</span></h1>
          <p style={styles.brandSubtitle}>Staff Portal & Command Center</p>
        </div>

        <div style={styles.tabContainer}>
          <button
            onClick={() => { setIsLogin(true); setIsForgotPassword(false); setError(''); setSuccess(''); }}
            style={{
              ...styles.tabButton,
              borderBottomColor: (isLogin && !isForgotPassword) ? '#2563eb' : 'transparent',
              color: (isLogin && !isForgotPassword) ? '#f3f4f6' : '#9ca3af',
            }}
          >
            <LogIn size={18} />
            Sign In
          </button>
          <button
            onClick={() => { setIsLogin(false); setIsForgotPassword(false); setError(''); setSuccess(''); }}
            style={{
              ...styles.tabButton,
              borderBottomColor: (!isLogin && !isForgotPassword) ? '#2563eb' : 'transparent',
              color: (!isLogin && !isForgotPassword) ? '#f3f4f6' : '#9ca3af',
            }}
          >
            <UserPlus size={18} />
            Register
          </button>
        </div>

        {error && (
          <div style={styles.errorBanner}>
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div style={styles.successBanner}>
            <Award size={18} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && !isForgotPassword && (
            <div style={styles.row}>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>First Name</label>
                <div style={styles.inputInnerWrapper}>
                  <User size={16} style={styles.inputIcon} />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Evan"
                    className="input-field"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>Last Name <span style={styles.optionalLabel}>Optional</span></label>
                <div style={styles.inputInnerWrapper}>
                  <User size={16} style={styles.inputIcon} />
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Optional"
                    className="input-field"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
            </div>
          )}

          {!isLogin && !isForgotPassword && (
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Roblox Username</label>
              <div style={styles.inputInnerWrapper}>
                <Award size={16} style={styles.inputIcon} />
                <input
                  type="text"
                  required
                  value={robloxUsername}
                  onChange={(e) => setRobloxUsername(e.target.value)}
                  placeholder="EvanOxton"
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                />
              </div>
            </div>
          )}

          <div style={styles.inputWrapper}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputInnerWrapper}>
              <Mail size={16} style={styles.inputIcon} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="input-field"
                style={{ paddingLeft: '38px' }}
              />
            </div>
          </div>

          {!isForgotPassword && (
            <div style={styles.inputWrapper}>
              <label style={styles.label}>Password</label>
              <div style={{...styles.inputInnerWrapper, position: 'relative'}}>
                <Key size={16} style={styles.inputIcon} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field"
                  style={{ paddingLeft: '38px', paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#9ca3af',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {isLogin && !isForgotPassword && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', marginBottom: '8px' }}>
              <input 
                type="checkbox" 
                id="rememberMe" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)} 
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="rememberMe" style={{ ...styles.label, cursor: 'pointer', margin: 0 }}>Remember Me</label>
            </div>
          )}

          <div style={{ ...styles.inputWrapper, alignItems: 'center' }}>
            <label style={{ ...styles.label, textAlign: 'center', marginBottom: '8px' }}>
              Security Check: Select all images with <strong>{captchaTarget}s</strong>
            </label>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(3, 1fr)', 
              gap: '8px', 
              background: 'rgba(255,255,255,0.05)', 
              padding: '12px', 
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.1)'
            }}>
              {captchaGrid.map((iconName, idx) => {
                const isSelected = selectedCaptchaIndices.includes(idx);
                let IconComp = null;
                switch(iconName) {
                  case 'Plane': IconComp = <Plane size={24} color="#fff" />; break;
                  case 'Star': IconComp = <Star size={24} color="#fff" />; break;
                  case 'Heart': IconComp = <Heart size={24} color="#fff" />; break;
                  case 'Cloud': IconComp = <Cloud size={24} color="#fff" />; break;
                  case 'Moon': IconComp = <Moon size={24} color="#fff" />; break;
                  case 'Sun': IconComp = <Sun size={24} color="#fff" />; break;
                  case 'Camera': IconComp = <Camera size={24} color="#fff" />; break;
                  case 'Bell': IconComp = <Bell size={24} color="#fff" />; break;
                  case 'Zap': IconComp = <Zap size={24} color="#fff" />; break;
                }
                return (
                  <div 
                    key={idx}
                    onClick={() => toggleCaptchaSelection(idx)}
                    style={{
                      width: '64px',
                      height: '64px',
                      background: isSelected ? '#3b82f6' : 'rgba(0,0,0,0.3)',
                      border: isSelected ? '2px solid #60a5fa' : '2px solid transparent',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    {IconComp}
                  </div>
                );
              })}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={styles.submitBtn}
          >
            {loading ? (
              <div className="spinner-container" style={{ gap: '10px' }}>
                <span className="spinner-pulse"></span>
                <span className="spinner-ring"></span>
                <span>Authenticating...</span>
              </div>
            ) : (
              <span style={styles.btnContent}>
                {isForgotPassword ? 'Request Password Reset' : (isLogin ? 'Log In to System' : 'Create Staff Request')}
              </span>
            )}
          </button>

          {!isForgotPassword && isLogin && (
            <button 
              type="button" 
              onClick={() => { setIsForgotPassword(true); setError(''); setSuccess(''); }} 
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '0.85rem', cursor: 'pointer', marginTop: '8px' }}
            >
              Forgot Password?
            </button>
          )}
          {isForgotPassword && (
            <button 
              type="button" 
              onClick={() => { setIsForgotPassword(false); setError(''); setSuccess(''); }} 
              style={{ background: 'transparent', border: 'none', color: '#9ca3af', fontSize: '0.85rem', cursor: 'pointer', marginTop: '8px' }}
            >
              Back to Login
            </button>
          )}
        </form>
      </div>
      <div style={styles.versionText}>V1.2</div>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    fontSize: '0.9rem',
    cursor: 'pointer',
    marginBottom: '20px',
    padding: '0',
    transition: 'color 0.2s ease'
  },
  card: {
    width: '100%',
    maxWidth: '480px',
    padding: '40px 32px',
    transition: 'all 0.3s ease',
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoIconContainer: {
    width: '80px',
    height: '80px',
    borderRadius: '20px',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 20px rgba(139, 92, 246, 0.2)',
    marginBottom: '16px',
  },
  logoIcon: {
    width: '64px',
    height: '64px',
    objectFit: 'contain',
    filter: 'drop-shadow(0 0 8px rgba(139, 92, 246, 0.5))',
  },
  brandTitle: {
    fontSize: '2rem',
    fontWeight: '900',
    letterSpacing: '3px',
    color: 'var(--color-text-main)',
    textShadow: '0 0 10px rgba(255, 255, 255, 0.1)',
  },
  brandSubtitle: {
    fontSize: '0.875rem',
    color: '#9ca3af',
    marginTop: '4px',
  },
  tabContainer: {
    display: 'flex',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    marginBottom: '24px',
  },
  tabButton: {
    flex: 1,
    padding: '12px 0',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  inputWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '500',
    color: '#d1d5db',
  },
  optionalLabel: {
    color: '#9ca3af',
    fontSize: '0.75rem',
    fontWeight: '400',
    marginLeft: '4px',
  },
  inputInnerWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    color: 'rgba(255, 255, 255, 0.35)',
    pointerEvents: 'none',
  },
  submitBtn: {
    padding: '14px',
    borderRadius: '8px',
    marginTop: '10px',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '52px',
  },
  btnContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  errorBanner: {
    background: 'rgba(239, 68, 68, 0.15)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '0.85rem',
    color: '#fca5a5',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    lineHeight: '1.4',
  },
  successBanner: {
    background: 'rgba(16, 185, 129, 0.15)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '8px',
    padding: '12px',
    fontSize: '0.85rem',
    color: '#a7f3d0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px',
    lineHeight: '1.4',
  },
  versionText: {
    position: 'absolute',
    bottom: '20px',
    color: '#6b7280',
    fontSize: '0.85rem',
    fontWeight: '500',
    letterSpacing: '1px',
  },
};
