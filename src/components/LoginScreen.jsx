import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Captcha from './Captcha';
import { 
  LogIn, UserPlus, Key, Mail, User, ShieldAlert, Award, ChevronLeft, 
  Eye, EyeOff, Lock, CheckCircle 
} from 'lucide-react';

export default function LoginScreen({ onBack, initialChangePasswordEmail = null }) {
  const { login, signup, requestPasswordReset, completePasswordReset } = useApp();
  const [rememberMe, setRememberMe] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Captcha verification state
  const [captchaVerified, setCaptchaVerified] = useState(false);

  // Temporary password flow states
  const [isChangingPassword, setIsChangingPassword] = useState(Boolean(initialChangePasswordEmail));
  const [tempUserEmail, setTempUserEmail] = useState(initialChangePasswordEmail || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [robloxUsername, setRobloxUsername] = useState('');

  const handleTabChange = (loginMode) => {
    setIsLogin(loginMode);
    setIsForgotPassword(false);
    setIsChangingPassword(false);
    setError('');
    setSuccess('');
    setCaptchaVerified(false);
  };

  const handleNewPasswordSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('New passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);
    try {
      await completePasswordReset(tempUserEmail, newPassword);
      setSuccess('Password updated successfully! Welcome to Oxton Oportal.');
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!captchaVerified) {
      setError('Please complete the security check (I\'m not a robot) to continue.');
      return;
    }

    setLoading(true);

    try {
      if (isForgotPassword) {
        if (!email) throw new Error('Please enter your email address.');
        await requestPasswordReset(email);
        setSuccess('Password reset request submitted. An administrator will review your request and issue a temporary password.');
        setIsForgotPassword(false);
        setCaptchaVerified(false);
      } else if (isLogin) {
        const res = await login(email, password, rememberMe);
        if (res?.requiresPasswordChange) {
          setTempUserEmail(res.email || email);
          setIsChangingPassword(true);
          setPassword('');
          setSuccess('Temporary password verified. Please choose your new permanent password below.');
          setCaptchaVerified(false);
        }
      } else {
        if (!firstName || !robloxUsername || !email || !password) {
          throw new Error('Please fill in all fields.');
        }
        await signup({ email, password, firstName, lastName, robloxUsername });
        setSuccess('Registration successful! Your account is pending admin approval.');
        setIsLogin(true);
        setPassword('');
        setCaptchaVerified(false);
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
        {onBack && !isChangingPassword && (
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
          <h1 style={styles.brandTitle}>Oxton Oportal</h1>
          <p style={styles.brandSubtitle}>Staff Portal & Command Center</p>
        </div>

        {/* Temporary Password -> Set New Password Screen */}
        {isChangingPassword ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={styles.iconCircle}>
                <Key size={26} color="#3b82f6" />
              </div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#f3f4f6', marginTop: '12px' }}>
                Create New Password
              </h2>
              <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '6px', lineHeight: '1.4' }}>
                You logged in with a temporary password for <strong>{tempUserEmail}</strong>. Please set a new permanent password for your account.
              </p>
            </div>

            {error && (
              <div style={styles.errorBanner}>
                <ShieldAlert size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div style={styles.successBanner}>
                <CheckCircle size={18} style={{ flexShrink: 0 }} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleNewPasswordSubmit} style={styles.form}>
              <div style={styles.inputWrapper}>
                <label style={styles.label}>New Permanent Password</label>
                <div style={{ ...styles.inputInnerWrapper, position: 'relative' }}>
                  <Lock size={16} style={styles.inputIcon} />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="input-field"
                    style={{ paddingLeft: '38px', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={styles.eyeBtn}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={styles.inputWrapper}>
                <label style={styles.label}>Confirm New Password</label>
                <div style={{ ...styles.inputInnerWrapper, position: 'relative' }}>
                  <Lock size={16} style={styles.inputIcon} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="input-field"
                    style={{ paddingLeft: '38px', paddingRight: '40px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeBtn}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#6b7280', padding: '0 4px' }}>
                • Password must be at least 6 characters long.<br />
                • Keep your password private and do not share it with anyone.
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
                    <span>Updating Password...</span>
                  </div>
                ) : (
                  <span style={styles.btnContent}>
                    <CheckCircle size={18} />
                    Save New Password & Enter Portal
                  </span>
                )}
              </button>

              <button 
                type="button" 
                onClick={() => {
                  setIsChangingPassword(false);
                  setPassword('');
                  setError('');
                  setSuccess('');
                }} 
                style={styles.subtleLinkBtn}
              >
                Back to Sign In
              </button>
            </form>
          </div>
        ) : (
          /* Standard Sign In / Register / Forgot Password View */
          <div>
            <div style={styles.tabContainer}>
              <button
                onClick={() => handleTabChange(true)}
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
                onClick={() => handleTabChange(false)}
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

            {isForgotPassword && (
              <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#f3f4f6' }}>
                  Forgot Your Password?
                </h3>
                <p style={{ fontSize: '0.85rem', color: '#9ca3af', marginTop: '4px' }}>
                  Enter your registered staff email. An administrator will review your request and issue a temporary login password.
                </p>
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
                  <label style={styles.label}>
                    {isLogin ? 'Password / Temporary Password' : 'Password'}
                  </label>
                  <div style={{ ...styles.inputInnerWrapper, position: 'relative' }}>
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
                      style={styles.eyeBtn}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {isLogin && !isForgotPassword && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', marginBottom: '4px' }}>
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

              {/* Realistic reCAPTCHA Component */}
              <Captcha 
                verified={captchaVerified} 
                onVerify={() => {
                  setCaptchaVerified(true);
                  setError('');
                }} 
              />

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
                  onClick={() => { 
                    setIsForgotPassword(true); 
                    setError(''); 
                    setSuccess(''); 
                    setCaptchaVerified(false);
                  }} 
                  style={styles.subtleLinkBtn}
                >
                  Forgot Password?
                </button>
              )}
              {isForgotPassword && (
                <button 
                  type="button" 
                  onClick={() => { 
                    setIsForgotPassword(false); 
                    setError(''); 
                    setSuccess(''); 
                    setCaptchaVerified(false);
                  }} 
                  style={styles.subtleLinkBtn}
                >
                  Back to Sign In
                </button>
              )}
            </form>
          </div>
        )}
      </div>
      <div style={styles.versionText}>V2.1.1</div>
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
    marginBottom: '28px',
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
  iconCircle: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    border: '1px solid rgba(59, 130, 246, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
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
  eyeBtn: {
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
    justifyContent: 'center',
  },
  submitBtn: {
    padding: '14px',
    borderRadius: '8px',
    marginTop: '6px',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '50px',
  },
  btnContent: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
  },
  subtleLinkBtn: {
    background: 'transparent',
    border: 'none',
    color: '#9ca3af',
    fontSize: '0.85rem',
    cursor: 'pointer',
    marginTop: '6px',
    textAlign: 'center',
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
    marginBottom: '16px',
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
    marginBottom: '16px',
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
