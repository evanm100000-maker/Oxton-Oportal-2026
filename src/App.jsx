import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import WarningBanner from './components/WarningBanner';
import UpdateBanner from './components/UpdateBanner';
import MaintenanceScreen from './components/MaintenanceScreen';
import SuspendedScreen from './components/SuspendedScreen';
import NotificationOverlay from './components/NotificationOverlay';
import LoaBanner from './components/LoaBanner';
import BypassOverlay from './components/BypassOverlay';
import EmergencyAlertOverlay from './components/EmergencyAlertOverlay';
import LandingPage from './components/LandingPage';
import { useState } from 'react';
import UpdateNotifier from './components/UpdateNotifier';
import './utils/sirenAudio';
import { CallProvider } from './context/CallContext';
import VoiceCallOverlay from './components/VoiceCallOverlay';

function MainApp() {
  const { currentUser, maintenanceConfig, logout } = useApp();
  const [bypassMaint, setBypassMaint] = useState(false);
  const [portalType, setPortalType] = useState(() => {
    return sessionStorage.getItem('oxton_portalType') || null;
  }); // 'passenger' | 'staff' | null

  // Security: Auto-logout after 30 minutes of inactivity to protect unattended staff sessions
  React.useEffect(() => {
    if (!currentUser) return;
    let timeoutId;
    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000;

    const handleActivity = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (logout) logout();
        alert('Security Notice: Your session was safely locked after 30 minutes of inactivity.');
      }, INACTIVITY_LIMIT_MS);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }));
    handleActivity();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(evt => window.removeEventListener(evt, handleActivity));
    };
  }, [currentUser, logout]);

  React.useEffect(() => {
    if (portalType) {
      sessionStorage.setItem('oxton_portalType', portalType);
    } else {
      sessionStorage.removeItem('oxton_portalType');
    }
  }, [portalType]);

  // If maintenance is active, and they aren't logged in as an admin, show Maintenance.
  if (maintenanceConfig?.isActive && !currentUser?.isAdmin) {
    if (currentUser && !currentUser.isAdmin) {
      return <MaintenanceScreen onBypass={() => {}} allowBypass={false} />;
    }
    if (!bypassMaint) {
      return <MaintenanceScreen onBypass={() => setBypassMaint(true)} allowBypass={true} />;
    }
    return (
      <>
        <WarningBanner />
        <UpdateBanner />
        <LoaBanner />
        <LoginScreen onBack={() => setBypassMaint(false)} />
        <NotificationOverlay />
      </>
    );
  }

  // Check suspension
  if (currentUser?.suspendedUntil && new Date(currentUser.suspendedUntil).getTime() > Date.now()) {
    return <SuspendedScreen />;
  }

  // Force password change if user logged in with temporary password
  if (currentUser?.mustChangePassword) {
    return (
      <>
        <WarningBanner />
        <UpdateBanner />
        <LoaBanner />
        <LoginScreen initialChangePasswordEmail={currentUser.email} />
        <NotificationOverlay />
      </>
    );
  }

  // Landing Page Selection
  if (!portalType && !currentUser) {
    return (
      <>
        <WarningBanner />
        <UpdateBanner />
        <LoaBanner />
        <LandingPage onSelectPortal={(type) => setPortalType(type)} />
        <NotificationOverlay />
        <BypassOverlay />
        <EmergencyAlertOverlay />
      </>
    );
  }


  // Staff Portal (Dashboard or Login)
  return (
    <>
      <WarningBanner />
      <UpdateBanner />
      <LoaBanner />
      {currentUser ? <Dashboard /> : <LoginScreen onBack={() => setPortalType(null)} />}
      <NotificationOverlay />
      <BypassOverlay />
      <EmergencyAlertOverlay />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <CallProvider>
        <MainApp />
        <VoiceCallOverlay />
        <UpdateNotifier />
      </CallProvider>
    </AppProvider>
  );
}
