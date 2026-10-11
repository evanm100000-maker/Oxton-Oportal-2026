import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DownloadCloud, CheckCircle, AlertCircle, X, RefreshCw } from 'lucide-react';

export default function UpdateNotifier() {
  const [status, setStatus] = useState('idle'); // idle, downloading, downloaded, error
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run if we are in Electron and require is available
    if (!window.require) return;

    try {
      const { ipcRenderer } = window.require('electron');

      const handleAvailable = () => {
        setStatus('downloading');
        setProgress(0);
        setIsVisible(true);
      };

      const handleProgress = (event, progressObj) => {
        if (progressObj && progressObj.percent) {
          setProgress(Math.round(progressObj.percent));
        }
      };

      const handleDownloaded = () => {
        setStatus('downloaded');
        setProgress(100);
        setIsVisible(true);
      };

      const handleError = (event, errorText) => {
        setStatus('error');
        setErrorMsg(errorText);
        setIsVisible(true);
      };

      ipcRenderer.on('updater:available', handleAvailable);
      ipcRenderer.on('updater:progress', handleProgress);
      ipcRenderer.on('updater:downloaded', handleDownloaded);
      ipcRenderer.on('updater:error', handleError);

      return () => {
        ipcRenderer.removeListener('updater:available', handleAvailable);
        ipcRenderer.removeListener('updater:progress', handleProgress);
        ipcRenderer.removeListener('updater:downloaded', handleDownloaded);
        ipcRenderer.removeListener('updater:error', handleError);
      };
    } catch (e) {
      console.log('Update Notifier: Not running in Electron or require failed', e);
    }
  }, []);

  const handleInstall = () => {
    if (window.require) {
      const { ipcRenderer } = window.require('electron');
      ipcRenderer.send('updater:install');
    }
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence mode="wait">
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
          animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={styles.container}
        >
          <button onClick={handleClose} style={styles.closeBtn}>
            <X size={16} />
          </button>
          
          <div style={styles.content}>
            {status === 'downloading' && (
              <>
                <div style={styles.iconWrapper}>
                  <RefreshCw size={24} color="#60a5fa" className="spin-animation" />
                </div>
                <div style={styles.textContainer}>
                  <h3 style={styles.title}>Update Downloading</h3>
                  <p style={styles.desc}>Fetching the latest features...</p>
                  <div style={styles.progressBarBg}>
                    <motion.div 
                      style={styles.progressBarFill}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear", duration: 0.2 }}
                    />
                  </div>
                  <p style={styles.progressText}>{progress}%</p>
                </div>
              </>
            )}

            {status === 'downloaded' && (
              <>
                <div style={{...styles.iconWrapper, background: 'rgba(52, 211, 153, 0.15)'}}>
                  <CheckCircle size={24} color="#34d399" />
                </div>
                <div style={styles.textContainer}>
                  <h3 style={styles.title}>Update Ready!</h3>
                  <p style={styles.desc}>A new version of Oxton Oportal is ready to install.</p>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleInstall}
                    style={styles.installBtn}
                  >
                    Restart & Install
                  </motion.button>
                </div>
              </>
            )}

            {status === 'error' && (
              <>
                <div style={{...styles.iconWrapper, background: 'rgba(248, 113, 113, 0.15)'}}>
                  <AlertCircle size={24} color="#f87171" />
                </div>
                <div style={styles.textContainer}>
                  <h3 style={styles.title}>Update Failed</h3>
                  <p style={{...styles.desc, color: '#f87171', fontSize: '0.8rem', maxHeight: '40px', overflow: 'hidden'}}>{errorMsg}</p>
                </div>
              </>
            )}
          </div>
          
          <style>{`
            @keyframes spin { 100% { transform: rotate(360deg); } }
            .spin-animation { animation: spin 2s linear infinite; }
          `}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const styles = {
  container: {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '320px',
    background: 'rgba(15, 23, 42, 0.85)',
    backdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)',
    zIndex: 99999,
    fontFamily: "'Inter', sans-serif",
  },
  closeBtn: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    background: 'transparent',
    border: 'none',
    color: '#64748b',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
  },
  content: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
  },
  iconWrapper: {
    width: '48px',
    height: '48px',
    borderRadius: '12px',
    background: 'rgba(59, 130, 246, 0.15)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  title: {
    margin: '0 0 4px 0',
    color: '#ffffff',
    fontSize: '1rem',
    fontWeight: '600',
  },
  desc: {
    margin: '0 0 12px 0',
    color: '#94a3b8',
    fontSize: '0.85rem',
    lineHeight: '1.4',
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '3px',
    overflow: 'hidden',
    position: 'relative',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
    borderRadius: '3px',
  },
  progressText: {
    margin: '4px 0 0 0',
    fontSize: '0.75rem',
    color: '#64748b',
    textAlign: 'right',
  },
  installBtn: {
    background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
  }
};
