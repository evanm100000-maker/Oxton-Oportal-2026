import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { X, Moon, Sun, Save, User, Image as ImageIcon, Upload, Clock, Battery, ToggleLeft, ToggleRight, Calendar } from 'lucide-react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';
import { compressImage } from '../utils/compressImage';

export default function SettingsModal({ isOpen, onClose }) {
  const { currentUser, updateUserProfile, theme, toggleTheme, showClockBattery, setShowClockBattery, use24HourClock, setUse24HourClock, useLongDateFormat, setUseLongDateFormat } = useApp();
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [robloxUsername, setRobloxUsername] = useState('');
  
  // Crop state
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName || '');
      setLastName(currentUser.lastName || '');
      setEmail(currentUser.email || '');
      setProfilePicture(currentUser.profilePicture || '');
      setRobloxUsername(currentUser.robloxUsername || '');
      setImageSrc(null);
      setCroppedAreaPixels(null);
    }
  }, [currentUser, isOpen]);

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener('load', () => setImageSrc(reader.result));
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let finalProfileUrl = profilePicture;
      
      if (imageSrc && croppedAreaPixels) {
        const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
        
        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(croppedImageBlob);
        });

        finalProfileUrl = await compressImage(dataUrl, 800, 0.6);
      }

      updateUserProfile(email, firstName, lastName, finalProfileUrl, robloxUsername);
      onClose();
    } catch (err) {
      console.error('Error uploading profile picture:', err);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
      setImageSrc(null);
    }
  };

  return (
    <div style={styles.overlay}>
      <div className="glass-panel slam-element" style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>User Settings</h2>
          <button onClick={onClose} style={styles.closeBtn}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSave} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>First Name</label>
              <div style={styles.inputInner}>
                <User size={16} style={styles.inputIcon} />
                <input
                  type="text"
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Last Name (Optional)</label>
              <div style={styles.inputInner}>
                <User size={16} style={styles.inputIcon} />
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Profile Picture</label>
            {!imageSrc ? (
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                {profilePicture && (
                  <img src={profilePicture} alt="Current profile" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                )}
                <label style={{ ...styles.inputInner, cursor: 'pointer', padding: '10px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', flex: 1, display: 'flex', justifyContent: 'center', gap: '8px', border: '1px solid var(--color-border)' }}>
                  <Upload size={16} />
                  <span>Choose Image</span>
                  <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              </div>
            ) : (
              <div style={{ position: 'relative', width: '100%', height: '200px', background: '#222', borderRadius: '8px', overflow: 'hidden' }}>
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              </div>
            )}
            {imageSrc && (
              <button type="button" onClick={() => setImageSrc(null)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '0.85rem', marginTop: '8px', textAlign: 'left' }}>
                Cancel new image
              </button>
            )}
          </div>

          <div style={styles.row}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Email Address</label>
              <div style={styles.inputInner}>
                <User size={16} style={styles.inputIcon} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Roblox Username</label>
              <div style={styles.inputInner}>
                <User size={16} style={styles.inputIcon} />
                <input
                  type="text"
                  required
                  value={robloxUsername}
                  onChange={(e) => setRobloxUsername(e.target.value)}
                  className="input-field"
                  style={{ paddingLeft: '36px' }}
                />
              </div>
            </div>
          </div>

          <div style={styles.themeToggleContainer}>
            <span style={styles.label}>App Theme</span>
            <button 
              type="button" 
              onClick={toggleTheme}
              style={styles.themeToggleBtn}
              className="btn-secondary"
            >
              {theme === 'dark' ? (
                <><Sun size={16} /> Switch to Light Mode</>
              ) : (
                <><Moon size={16} /> Switch to Dark Mode</>
              )}
            </button>
          </div>

          <div style={{ ...styles.themeToggleContainer, marginTop: '16px' }}>
            <span style={styles.label}>Clock & Battery Display</span>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                type="button" 
                onClick={() => setShowClockBattery(!showClockBattery)}
                style={{ ...styles.themeToggleBtn, flex: 1, justifyContent: 'center' }}
                className="btn-secondary"
              >
                {showClockBattery ? (
                  <><ToggleRight size={18} color="#10b981" /> Enabled</>
                ) : (
                  <><ToggleLeft size={18} color="#94a3b8" /> Disabled</>
                )}
              </button>
              
              {showClockBattery && (
                <>
                  <button 
                    type="button" 
                    onClick={() => setUse24HourClock(!use24HourClock)}
                    style={{ ...styles.themeToggleBtn, flex: 1, justifyContent: 'center' }}
                    className="btn-secondary"
                  >
                    {use24HourClock ? (
                      <><Clock size={16} /> 24-Hour</>
                    ) : (
                      <><Clock size={16} /> 12-Hour</>
                    )}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setUseLongDateFormat(!useLongDateFormat)}
                    style={{ ...styles.themeToggleBtn, flex: 1, justifyContent: 'center' }}
                    className="btn-secondary"
                  >
                    {useLongDateFormat ? (
                      <><Calendar size={16} /> Long Date</>
                    ) : (
                      <><Calendar size={16} /> Short Date</>
                    )}
                  </button>
                </>
              )}
            </div>
          </div>

          <div style={styles.footer}>
            <button type="button" onClick={onClose} className="btn-secondary" style={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={isUploading} className="btn-primary" style={{ ...styles.saveBtn, opacity: isUploading ? 0.7 : 1 }}>
              <Save size={16} /> {isUploading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.6)',
    backdropFilter: 'blur(4px)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    width: '100%',
    maxWidth: '480px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: 'inherit',
  },
  closeBtn: {
    background: 'transparent',
    border: 'none',
    color: 'var(--color-text-muted)',
    cursor: 'pointer',
    padding: '4px',
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
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: 'var(--color-text-muted)',
  },
  inputInner: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '12px',
    color: 'var(--color-text-muted)',
  },
  themeToggleContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 0',
    borderTop: '1px solid var(--color-border)',
    borderBottom: '1px solid var(--color-border)',
    marginTop: '8px',
  },
  themeToggleBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '0.9rem',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '16px',
  },
  cancelBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
  },
  saveBtn: {
    padding: '10px 20px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
};
