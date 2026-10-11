import React, { useState } from 'react';
import { Plane, Users, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';

export default function LandingPage({ onSelectPortal }) {
  const [selectedCard, setSelectedCard] = useState(null);

  const handleSelect = (portal) => {
    setSelectedCard(portal);
    setTimeout(() => {
      onSelectPortal(portal);
    }, 700);
  };

  return (
    <div style={styles.container}>
      {/* Background layer */}
      <div style={styles.background} />
      <div style={styles.gridOverlay} />

      <div style={styles.contentWrapper}>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: selectedCard ? 0 : 1, y: selectedCard ? -30 : 0 }}
          transition={{ duration: 0.4 }}
          style={styles.header}
        >
          <div style={styles.logoContainer}>
            <img src="./logo.png" alt="Oxton Logo" style={styles.logoIcon} />
          </div>
          <h1 style={styles.title}>Oxton Oportal <span style={{ fontFamily: 'monospace', fontSize: '0.4em', color: '#60a5fa', verticalAlign: 'super', fontWeight: 'bold' }}>BETA</span></h1>
          <p style={styles.subtitle}>Select your portal</p>
          <div style={{ marginTop: '20px' }}>
            {/* App downloads removed */}
          </div>
        </motion.div>

        <div style={styles.cardsContainer}>
          {/* Staff Card */}
          <motion.button
            layout
            initial={{ opacity: 0, y: 30 }}
            animate={
              selectedCard === 'staff' 
                ? { scale: 1.05, opacity: 0, y: -20, zIndex: 100 } 
                : selectedCard 
                  ? { opacity: 0, scale: 0.95, y: 10 } 
                  : { opacity: 1, y: 0, scale: 1 }
            }
            whileHover={selectedCard ? {} : { scale: 1.02, y: -5 }}
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
            onClick={() => handleSelect('staff')}
            style={{
              ...styles.card, 
              background: 'rgba(139, 92, 246, 0.08)', 
              borderColor: 'rgba(139, 92, 246, 0.3)'
            }}
          >
            <div style={styles.cardInner}>
              <div style={{...styles.iconWrapper, background: 'rgba(139, 92, 246, 0.15)'}}>
                <Plane size={32} color="#c084fc" />
              </div>
              <div style={styles.textContainer}>
                <h2 style={styles.cardTitle}>Staff Portal</h2>
                <p style={styles.cardDesc}>Manage flights, tickets, and administration</p>
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      <div style={styles.versionText}>V1.2</div>
    </div>
  );
}

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    overflow: 'hidden',
    background: '#020617',
    fontFamily: "'Inter', sans-serif",
  },
  background: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'radial-gradient(circle at center, #1e293b 0%, #020617 100%)',
    zIndex: 0,
  },
  gridOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
    backgroundSize: '30px 30px',
    zIndex: 1,
    opacity: 0.5
  },
  contentWrapper: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    width: '100%',
    maxWidth: '900px',
    padding: '40px 20px',
  },
  header: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: '60px',
  },
  logoContainer: {
    width: '70px',
    height: '70px',
    borderRadius: '20px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
    backdropFilter: 'blur(10px)',
  },
  logoIcon: {
    width: '45px',
    height: '45px',
    objectFit: 'contain',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '6px',
    margin: '0 0 8px 0',
  },
  subtitle: {
    fontSize: '0.95rem',
    color: '#94a3b8',
    margin: 0,
    letterSpacing: '1px',
    fontWeight: '400',
  },
  cardsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '24px',
    width: '100%',
  },
  card: {
    border: '1px solid',
    borderRadius: '16px',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
    padding: 0,
    outline: 'none',
    backdropFilter: 'blur(10px)',
  },
  cardInner: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 24px',
    textAlign: 'center',
  },
  iconWrapper: {
    width: '64px',
    height: '64px',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  textContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  cardTitle: {
    fontSize: '1.4rem',
    fontWeight: '600',
    color: '#ffffff',
    margin: 0,
    letterSpacing: '0.5px',
  },
  cardDesc: {
    fontSize: '0.9rem',
    color: '#94a3b8',
    margin: 0,
    lineHeight: '1.5',
  },
  versionText: {
    position: 'absolute',
    bottom: '24px',
    color: '#475569',
    fontSize: '0.8rem',
    fontWeight: '500',
    letterSpacing: '1px',
    zIndex: 10,
  }
};
