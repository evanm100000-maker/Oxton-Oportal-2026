import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, firebaseApp } from '../firebase';
import { ref, onValue, set, update, push, remove, onDisconnect } from 'firebase/database';
import { useApp } from './AppContext';
import { 
  playIncomingRingtone, 
  stopIncomingRingtone, 
  playOutgoingCallingSound, 
  stopOutgoingCallingSound, 
  playCallEndSound,
  playMuteSound,
  playUnmuteSound,
  playDeafenSound,
  playUndeafenSound,
  playCallWaitingBeep,
  playAdminMutedSound
} from '../utils/callSounds';

const CallContext = createContext(null);

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' }
  ],
  iceCandidatePoolSize: 10
};

export const toSafeEmail = (email) => {
  if (!email || typeof email !== 'string') return '';
  return email.trim().toLowerCase().replace(/\./g, ',');
};

export function CallProvider({ children }) {
  const { currentUser } = useApp();
  
  // Call States
  const [activeCall, setActiveCall] = useState(null);
  const [callRole, setCallRole] = useState(null); // 'caller' | 'receiver' | null
  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'calling' | 'connected' | 'declined' | 'ended'
  const [incomingCall, setIncomingCall] = useState(null);
  const [heldCall, setHeldCall] = useState(null); // Call put on hold
  const [adminMutedBanner, setAdminMutedBanner] = useState(false);
  
  // Basic Audio Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Microphone selection & Volume state
  const [selectedMicId, setSelectedMicId] = useState(() => {
    try {
      return localStorage.getItem('oxton_selected_mic') || '';
    } catch {
      return '';
    }
  });
  const [availableMics, setAvailableMics] = useState([]);
  const [micVolume, setMicVolumeState] = useState(() => {
    try {
      const v = localStorage.getItem('oxton_mic_volume');
      return v !== null ? Number(v) : 100;
    } catch {
      return 100;
    }
  });
  const [peerVolume, setPeerVolumeState] = useState(() => {
    try {
      const v = localStorage.getItem('oxton_peer_volume');
      return v !== null ? Number(v) : 100;
    } catch {
      return 100;
    }
  });
  const [micInputLevel, setMicInputLevel] = useState(0);

  // WebRTC & Audio Graph Refs
  const pcRef = useRef(null);
  const rawLocalStreamRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteAudioElRef = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const durationTimerRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const callStartTimeRef = useRef(0);
  const isMutedRef = useRef(false);
  
  // Web Audio Nodes & Sources
  const audioContextRef = useRef(null);
  const localSourceNodeRef = useRef(null);
  const remoteSourceNodeRef = useRef(null);
  const localAnalyserRef = useRef(null);
  const remoteAnalyserRef = useRef(null);
  const meterIntervalRef = useRef(null);

  // Keep isMutedRef synced
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Clean up remote audio element on unmount
  useEffect(() => {
    return () => {
      if (remoteAudioElRef.current) {
        try {
          remoteAudioElRef.current.srcObject = null;
          remoteAudioElRef.current.pause();
        } catch {}
      }
    };
  }, []);

  // Enumerate input devices
  const refreshAudioDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const mics = devices.filter(d => d.kind === 'audioinput');
      setAvailableMics(mics);
    } catch (err) {
      console.debug('Failed to enumerate devices:', err);
    }
  };

  useEffect(() => {
    refreshAudioDevices();
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.addEventListener) {
      navigator.mediaDevices.addEventListener('devicechange', refreshAudioDevices);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', refreshAudioDevices);
      };
    }
  }, []);

  // Periodic Call Waiting chime if another person is calling while user is in active call
  useEffect(() => {
    if (incomingCall && activeCall && callStatus === 'connected') {
      playCallWaitingBeep();
      const interval = setInterval(() => {
        playCallWaitingBeep();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [incomingCall, activeCall, callStatus]);

  // Update Peer Volume
  const setPeerVolume = (vol) => {
    const num = Math.max(0, Math.min(200, Number(vol)));
    setPeerVolumeState(num);
    try { localStorage.setItem('oxton_peer_volume', num.toString()); } catch {}

    if (remoteAudioElRef.current) {
      remoteAudioElRef.current.volume = Math.min(1, Math.max(0, num / 100));
      remoteAudioElRef.current.muted = isDeafened;
    }
  };

  // Update Mic Volume (Input Gain display scaling)
  const setMicVolume = (vol) => {
    const num = Math.max(0, Math.min(200, Number(vol)));
    setMicVolumeState(num);
    try { localStorage.setItem('oxton_mic_volume', num.toString()); } catch {}
  };

  // Change Microphone Device
  const changeMicrophone = async (deviceId) => {
    setSelectedMicId(deviceId);
    try { localStorage.setItem('oxton_selected_mic', deviceId); } catch {}

    // If currently in a call, switch microphone track live!
    if (localStreamRef.current && pcRef.current) {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: deviceId ? { exact: deviceId } : undefined,
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          },
          video: false
        });

        // Stop old hardware tracks
        if (rawLocalStreamRef.current) {
          rawLocalStreamRef.current.getTracks().forEach(t => t.stop());
        }
        if (localStreamRef.current && localStreamRef.current !== rawLocalStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop());
        }

        rawLocalStreamRef.current = newStream;
        localStreamRef.current = newStream;

        const newRawTrack = newStream.getAudioTracks()[0];
        if (newRawTrack) {
          newRawTrack.enabled = isDeafened ? false : !isMuted;
          const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'audio');
          if (sender) {
            await sender.replaceTrack(newRawTrack);
          }
        }

        // Reconnect into Web Audio analyser if active
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
          try {
            if (localSourceNodeRef.current) {
              localSourceNodeRef.current.disconnect();
            }
            const ctx = audioContextRef.current;
            const newSource = ctx.createMediaStreamSource(newStream);
            localSourceNodeRef.current = newSource;
            if (localAnalyserRef.current) {
              newSource.connect(localAnalyserRef.current);
            }
          } catch (e) {
            console.debug('Failed to reconnect Web Audio source on device change:', e);
          }
        }
      } catch (err) {
        console.error('Failed to change microphone mid-call:', err);
      }
    }
  };

  // Setup Web Audio graph for local microphone
  const setupLocalAudioPipeline = async (deviceIdToUse) => {
    if (rawLocalStreamRef.current) {
      try { rawLocalStreamRef.current.getTracks().forEach(t => t.stop()); } catch {}
    }
    if (localStreamRef.current && localStreamRef.current !== rawLocalStreamRef.current) {
      try { localStreamRef.current.getTracks().forEach(t => t.stop()); } catch {}
    }

    const rawStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        deviceId: deviceIdToUse ? { exact: deviceIdToUse } : undefined,
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      },
      video: false
    });
    rawLocalStreamRef.current = rawStream;
    localStreamRef.current = rawStream;

    rawStream.getAudioTracks().forEach(track => {
      track.enabled = isDeafened ? false : !isMuted;
    });

    refreshAudioDevices();

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        if (localSourceNodeRef.current) {
          try { localSourceNodeRef.current.disconnect(); } catch {}
        }
        const source = ctx.createMediaStreamSource(rawStream);
        localSourceNodeRef.current = source;

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        localAnalyserRef.current = analyser;

        startMeters();
      }
    } catch (err) {
      console.debug('Web Audio local analyser setup fallback:', err);
    }

    return rawStream;
  };

  // Setup remote stream playback & audio analysis
  const playRemoteStream = (stream) => {
    remoteStreamRef.current = stream;

    if (remoteAudioElRef.current) {
      remoteAudioElRef.current.srcObject = stream;
      remoteAudioElRef.current.volume = Math.min(1, Math.max(0, peerVolume / 100));
      remoteAudioElRef.current.muted = isDeafened;
      const playPromise = remoteAudioElRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.debug('Autoplay remote stream note:', err);
          const unlock = () => {
            if (remoteAudioElRef.current) {
              remoteAudioElRef.current.play().catch(() => {});
            }
            window.removeEventListener('click', unlock);
            window.removeEventListener('keydown', unlock);
          };
          window.addEventListener('click', unlock, { once: true });
          window.addEventListener('keydown', unlock, { once: true });
        });
      }
    }

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
          audioContextRef.current = new AudioCtx();
        }
        const ctx = audioContextRef.current;
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }

        if (remoteSourceNodeRef.current) {
          try { remoteSourceNodeRef.current.disconnect(); } catch {}
        }
        const remoteSource = ctx.createMediaStreamSource(stream);
        remoteSourceNodeRef.current = remoteSource;

        const remoteAnalyser = ctx.createAnalyser();
        remoteAnalyser.fftSize = 256;
        remoteSource.connect(remoteAnalyser);
        remoteAnalyserRef.current = remoteAnalyser;

        startMeters();
      }
    } catch (err) {
      console.debug('Web Audio remote analyser setup note:', err);
    }
  };

  // Start real-time audio volume meters
  const startMeters = () => {
    if (meterIntervalRef.current) return;

    const dataArrayLocal = new Uint8Array(128);
    const dataArrayRemote = new Uint8Array(128);

    meterIntervalRef.current = setInterval(() => {
      // 1. Local mic level & speaking
      if (localAnalyserRef.current && !isMuted && !isDeafened) {
        localAnalyserRef.current.getByteFrequencyData(dataArrayLocal);
        let sum = 0;
        for (let i = 0; i < 128; i++) sum += dataArrayLocal[i];
        const avg = sum / 128;
        const scaledAvg = avg * (micVolume / 100);
        const level = Math.min(100, Math.round((scaledAvg / 128) * 100));
        setMicInputLevel(level);
        setLocalSpeaking(level > 12);
      } else {
        setMicInputLevel(0);
        setLocalSpeaking(false);
      }

      // 2. Remote peer speaking
      if (remoteAnalyserRef.current && !isDeafened) {
        remoteAnalyserRef.current.getByteFrequencyData(dataArrayRemote);
        let sum = 0;
        for (let i = 0; i < 128; i++) sum += dataArrayRemote[i];
        const avg = sum / 128;
        setRemoteSpeaking(avg > 15);
      } else {
        setRemoteSpeaking(false);
      }
    }, 100);
  };

  // Cleanup helper
  const cleanupCall = (notifyEnd = false) => {
    stopIncomingRingtone();
    stopOutgoingCallingSound();
    if (notifyEnd) {
      playCallEndSound();
    }

    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }
    if (meterIntervalRef.current) {
      clearInterval(meterIntervalRef.current);
      meterIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }

    if (localSourceNodeRef.current) {
      try { localSourceNodeRef.current.disconnect(); } catch {}
      localSourceNodeRef.current = null;
    }
    if (remoteSourceNodeRef.current) {
      try { remoteSourceNodeRef.current.disconnect(); } catch {}
      remoteSourceNodeRef.current = null;
    }

    localAnalyserRef.current = null;
    remoteAnalyserRef.current = null;

    // Stop raw media tracks
    if (rawLocalStreamRef.current) {
      try {
        rawLocalStreamRef.current.getTracks().forEach(track => track.stop());
      } catch {}
      rawLocalStreamRef.current = null;
    }

    if (localStreamRef.current && localStreamRef.current !== rawLocalStreamRef.current) {
      try {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      } catch {}
      localStreamRef.current = null;
    }

    // Close PeerConnection
    if (pcRef.current) {
      try {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }

    if (remoteAudioElRef.current) {
      try {
        remoteAudioElRef.current.srcObject = null;
        remoteAudioElRef.current.pause();
      } catch {}
    }

    remoteStreamRef.current = null;
    iceCandidatesQueue.current = [];

    // Clear busy presence status for current user if no held call
    if (currentUser?.email && !heldCall) {
      const mySafe = toSafeEmail(currentUser.email);
      try {
        onDisconnect(ref(db, `busyUsers/${mySafe}`)).cancel();
      } catch {}
      remove(ref(db, `busyUsers/${mySafe}`)).catch(() => {});
    }

    setActiveCall(null);
    setIncomingCall(null);
    setCallRole(null);
    setCallStatus('idle');
    setIsMuted(false);
    setIsDeafened(false);
    setCallDuration(0);
    setRemoteSpeaking(false);
    setLocalSpeaking(false);
    setMicInputLevel(0);
    setAdminMutedBanner(false);
  };

  // Listen for incoming calls targeted to currentUser
  useEffect(() => {
    if (!currentUser?.email) return;

    const myEmail = (currentUser.email || '').trim().toLowerCase();
    const safeEmail = toSafeEmail(myEmail);
    const rawSafeEmail = (currentUser.email || '').trim().replace(/\./g, ',');

    let activeCallListenerUnsub = null;

    const handleUserCallSnapshot = (snapshot) => {
      const data = snapshot.val();
      if (!data || !data.callId || data.status === 'ended' || data.status === 'declined') {
        if (activeCallListenerUnsub) {
          activeCallListenerUnsub();
          activeCallListenerUnsub = null;
        }
        setIncomingCall(null);
        stopIncomingRingtone();
        return;
      }

      // Fetch and listen to the full call object
      const callDataRef = ref(db, `calls/${data.callId}`);
      if (activeCallListenerUnsub) {
        activeCallListenerUnsub();
      }

      activeCallListenerUnsub = onValue(callDataRef, (callSnap) => {
        const callObj = callSnap.val();
        if (!callObj) {
          setIncomingCall(null);
          stopIncomingRingtone();
          return;
        }

        // If call was ended or declined
        if (callObj.status === 'ended' || callObj.status === 'declined') {
          setIncomingCall(null);
          stopIncomingRingtone();
          if (activeCall && activeCall.id === callObj.id) {
            setCallStatus(callObj.status);
            playCallEndSound();
            setTimeout(() => cleanupCall(false), 1500);
          }
          return;
        }

        const callReceiver = (callObj.receiverEmail || '').trim().toLowerCase();
        const callCaller = (callObj.callerEmail || '').trim().toLowerCase();
        const callMembers = Array.isArray(callObj.members)
          ? callObj.members.map(m => (m || '').trim().toLowerCase())
          : (callObj.members && typeof callObj.members === 'object' ? Object.values(callObj.members).map(m => (m || '').trim().toLowerCase()) : []);

        const isTargetOfCall = (callReceiver === myEmail) ||
          (callObj.type === 'group' && callMembers.includes(myEmail));

        if (isTargetOfCall && callCaller !== myEmail && callObj.status === 'calling') {
          // If already in a call: show call waiting UI without rejecting the incoming caller!
          if (activeCall && activeCall.id !== callObj.id) {
            setIncomingCall({ ...data, ...callObj, id: data.callId, isWaiting: true });
            return;
          }

          setIncomingCall({ ...data, ...callObj, id: data.callId, isWaiting: false });
          playIncomingRingtone();
        }
      });
    };

    const userCallRef = ref(db, `userCalls/${safeEmail}`);
    const unsubPrimary = onValue(userCallRef, handleUserCallSnapshot);

    let unsubSecondary = null;
    if (rawSafeEmail && rawSafeEmail !== safeEmail) {
      const rawUserCallRef = ref(db, `userCalls/${rawSafeEmail}`);
      unsubSecondary = onValue(rawUserCallRef, handleUserCallSnapshot);
    }

    return () => {
      unsubPrimary();
      if (unsubSecondary) unsubSecondary();
      if (activeCallListenerUnsub) activeCallListenerUnsub();
    };
  }, [currentUser?.email, activeCall?.id, callStatus]);

  // Synchronize active call updates (remote mute, deafen, answer, end, admin mute)
  useEffect(() => {
    if (!activeCall?.id || !currentUser?.email) return;

    const callRef = ref(db, `calls/${activeCall.id}`);
    const unsubscribe = onValue(callRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Check Admin Mute on current user
      if (data.adminMuted) {
        const mySafe = toSafeEmail(currentUser.email);
        const myMutedTimestamp = data.adminMuted[mySafe];
        if (myMutedTimestamp && myMutedTimestamp > (callStartTimeRef.current || 0) && !isMutedRef.current) {
          setIsMuted(true);
          isMutedRef.current = true;
          if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
          }
          if (rawLocalStreamRef.current) {
            rawLocalStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
          }
          playAdminMutedSound();
          setAdminMutedBanner(true);
        }
      }

      // Handle call ended or declined remotely
      if (data.status === 'ended' || data.status === 'declined') {
        setCallStatus(data.status);
        stopOutgoingCallingSound();
        stopIncomingRingtone();
        playCallEndSound();
        setTimeout(() => {
          cleanupCall(false);
        }, 1800);
        return;
      }

      // If caller receives answer
      if (callRole === 'caller' && data.answer && pcRef.current) {
        const pc = pcRef.current;
        if (!pc.currentRemoteDescription && pc.signalingState === 'have-local-offer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            while (iceCandidatesQueue.current.length > 0) {
              const candidate = iceCandidatesQueue.current.shift();
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.debug('Failed to add queued candidate:', e);
              }
            }
          } catch (err) {
            console.error('Error setting remote answer:', err);
          }
        }
      }

      // Status transitioned to connected
      if (data.status === 'connected' && callStatus !== 'connected') {
        stopOutgoingCallingSound();
        stopIncomingRingtone();
        setCallStatus('connected');
        callStartTimeRef.current = Date.now();
        if (!durationTimerRef.current) {
          durationTimerRef.current = setInterval(() => {
            setCallDuration(d => d + 1);
          }, 1000);
        }
      }

      setActiveCall(prev => ({
        ...prev,
        ...data
      }));
    });

    return () => {
      unsubscribe();
    };
  }, [activeCall?.id, callRole, callStatus, currentUser?.email]);

  // Listen to remote ICE candidates
  useEffect(() => {
    if (!activeCall?.id || !pcRef.current) return;

    const candidatesPath = callRole === 'caller' 
      ? `calls/${activeCall.id}/receiverCandidates` 
      : `calls/${activeCall.id}/callerCandidates`;
      
    const candidatesRef = ref(db, candidatesPath);
    const unsubscribe = onValue(candidatesRef, (snapshot) => {
      const candidates = snapshot.val();
      if (!candidates || !pcRef.current) return;

      Object.values(candidates).forEach(async (cand) => {
        const pc = pcRef.current;
        if (!pc) return;
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(cand));
          } catch (e) {
            console.debug('ICE candidate addition ignored:', e?.message || e);
          }
        } else {
          iceCandidatesQueue.current.push(cand);
        }
      });
    });

    return () => {
      unsubscribe();
    };
  }, [activeCall?.id, callRole]);

  // 1. INITIATE CALL (Caller)
  const initiateCall = async (targetUser) => {
    if (!currentUser || !targetUser) return;
    if (targetUser.email === currentUser.email) {
      alert("You cannot call yourself.");
      return;
    }
    if (activeCall) {
      alert("You are already in a call or calling someone.");
      return;
    }

    try {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      const streamToSend = await setupLocalAudioPipeline(selectedMicId);

      const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const callerSafe = toSafeEmail(currentUser.email);
      const receiverSafe = toSafeEmail(targetUser.email);
      const rawReceiverSafe = (targetUser.email || '').trim().replace(/\./g, ',');
      const rawCallerSafe = (currentUser.email || '').trim().replace(/\./g, ',');

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      iceCandidatesQueue.current = [];

      streamToSend.getAudioTracks().forEach(track => pc.addTrack(track, streamToSend));

      pc.ontrack = (event) => {
        const stream = (event.streams && event.streams[0])
          ? event.streams[0]
          : new MediaStream([event.track]);
        playRemoteStream(stream);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          push(ref(db, `calls/${callId}/callerCandidates`), event.candidate.toJSON());
        }
      };

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);

      const callData = {
        id: callId,
        callerEmail: currentUser.email,
        callerName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.robloxUsername,
        callerPfp: currentUser.profilePicture || '',
        callerRoblox: currentUser.robloxUsername || '',
        receiverEmail: targetUser.email,
        receiverName: `${targetUser.firstName || ''} ${targetUser.lastName || ''}`.trim() || targetUser.robloxUsername,
        receiverPfp: targetUser.profilePicture || '',
        receiverRoblox: targetUser.robloxUsername || '',
        status: 'calling',
        createdAt: Date.now(),
        offer: {
          type: offer.type,
          sdp: offer.sdp
        },
        callerMuted: false,
        receiverMuted: false,
        callerDeafened: false,
        receiverDeafened: false,
        adminMuted: {}
      };

      await set(ref(db, `calls/${callId}`), callData);
      onDisconnect(ref(db, `calls/${callId}/status`)).set('ended');

      const userCallPayload = {
        callId,
        status: 'calling',
        timestamp: Date.now(),
        callerEmail: currentUser.email,
        callerName: callData.callerName,
        callerPfp: callData.callerPfp,
        receiverEmail: targetUser.email
      };

      await set(ref(db, `userCalls/${receiverSafe}`), userCallPayload);
      if (rawReceiverSafe && rawReceiverSafe !== receiverSafe) {
        await set(ref(db, `userCalls/${rawReceiverSafe}`), userCallPayload).catch(() => {});
      }

      await set(ref(db, `userCalls/${callerSafe}`), {
        callId,
        status: 'calling',
        timestamp: Date.now()
      });
      if (rawCallerSafe && rawCallerSafe !== callerSafe) {
        await set(ref(db, `userCalls/${rawCallerSafe}`), {
          callId,
          status: 'calling',
          timestamp: Date.now()
        }).catch(() => {});
      }
      onDisconnect(ref(db, `userCalls/${callerSafe}`)).remove();

      // Mark caller as busy (yellow dot)
      await set(ref(db, `busyUsers/${callerSafe}`), {
        inCall: true,
        callId,
        timestamp: Date.now()
      });
      onDisconnect(ref(db, `busyUsers/${callerSafe}`)).remove();

      setActiveCall(callData);
      setCallRole('caller');
      setCallStatus('calling');
      setIsMuted(false);
      setIsDeafened(false);

      playOutgoingCallingSound();

      callTimeoutRef.current = setTimeout(() => {
        if (callStatus === 'calling') {
          update(ref(db, `calls/${callId}`), { status: 'ended', endedAt: Date.now() });
          remove(ref(db, `userCalls/${receiverSafe}`));
          remove(ref(db, `userCalls/${callerSafe}`));
          cleanupCall(true);
        }
      }, 45000);

    } catch (err) {
      console.error('Failed to initiate call:', err);
      alert('Could not access your microphone. Please enable microphone permissions in your browser.');
      cleanupCall();
    }
  };

  // 2. ANSWER CALL (Recipient)
  const answerCall = async (customCallToAnswer = null) => {
    const targetIncoming = customCallToAnswer || incomingCall;
    if (!targetIncoming) return;
    stopIncomingRingtone();
    const callId = targetIncoming.id;
    const receiverSafe = toSafeEmail(currentUser.email);
    const rawReceiverSafe = (currentUser.email || '').trim().replace(/\./g, ',');

    try {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      const streamToSend = await setupLocalAudioPipeline(selectedMicId);

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      iceCandidatesQueue.current = [];

      streamToSend.getAudioTracks().forEach(track => pc.addTrack(track, streamToSend));

      pc.ontrack = (event) => {
        const stream = (event.streams && event.streams[0])
          ? event.streams[0]
          : new MediaStream([event.track]);
        playRemoteStream(stream);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          push(ref(db, `calls/${callId}/receiverCandidates`), event.candidate.toJSON());
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(targetIncoming.offer));

      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.debug('Failed to add candidate during answer:', e);
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      await update(ref(db, `calls/${callId}`), {
        answer: { type: answer.type, sdp: answer.sdp },
        status: 'connected',
        answeredAt: Date.now()
      });
      onDisconnect(ref(db, `calls/${callId}/status`)).set('ended');

      await update(ref(db, `userCalls/${receiverSafe}`), { status: 'connected' }).catch(() => {});
      if (rawReceiverSafe && rawReceiverSafe !== receiverSafe) {
        await update(ref(db, `userCalls/${rawReceiverSafe}`), { status: 'connected' }).catch(() => {});
      }

      // Mark receiver as busy (yellow dot)
      await set(ref(db, `busyUsers/${receiverSafe}`), {
        inCall: true,
        callId,
        timestamp: Date.now()
      });
      onDisconnect(ref(db, `busyUsers/${receiverSafe}`)).remove();

      callStartTimeRef.current = Date.now();
      setActiveCall({ ...targetIncoming, status: 'connected' });
      setIncomingCall(null);
      setCallRole('receiver');
      setCallStatus('connected');
      setIsMuted(false);
      setIsDeafened(false);

      if (!durationTimerRef.current) {
        durationTimerRef.current = setInterval(() => {
          setCallDuration(d => d + 1);
        }, 1000);
      }
    } catch (err) {
      console.error('Failed to answer call:', err);
      alert('Could not access your microphone. Please enable microphone permissions in your browser.');
      declineCall();
    }
  };

  // 3. DECLINE CALL (Recipient)
  const declineCall = async () => {
    stopIncomingRingtone();
    if (!incomingCall) return;
    const callId = incomingCall.id;
    const receiverSafe = toSafeEmail(currentUser.email);
    const rawReceiverSafe = (currentUser.email || '').trim().replace(/\./g, ',');

    try {
      await update(ref(db, `calls/${callId}`), {
        status: 'declined',
        endedAt: Date.now()
      });
      await remove(ref(db, `userCalls/${receiverSafe}`)).catch(() => {});
      if (rawReceiverSafe && rawReceiverSafe !== receiverSafe) {
        await remove(ref(db, `userCalls/${rawReceiverSafe}`)).catch(() => {});
      }
    } catch {}

    setIncomingCall(null);
  };

  // 4. END CALL (Either party)
  const endCall = async () => {
    stopIncomingRingtone();
    stopOutgoingCallingSound();

    if (activeCall) {
      const callId = activeCall.id;
      const callerSafe = toSafeEmail(activeCall.callerEmail);
      const receiverSafe = toSafeEmail(activeCall.receiverEmail);
      const rawCallerSafe = (activeCall.callerEmail || '').trim().replace(/\./g, ',');
      const rawReceiverSafe = (activeCall.receiverEmail || '').trim().replace(/\./g, ',');

      try {
        await update(ref(db, `calls/${callId}`), {
          status: 'ended',
          endedAt: Date.now()
        });
        if (callerSafe) {
          remove(ref(db, `userCalls/${callerSafe}`)).catch(() => {});
          remove(ref(db, `busyUsers/${callerSafe}`)).catch(() => {});
        }
        if (rawCallerSafe && rawCallerSafe !== callerSafe) {
          remove(ref(db, `userCalls/${rawCallerSafe}`)).catch(() => {});
        }
        if (receiverSafe) {
          remove(ref(db, `userCalls/${receiverSafe}`)).catch(() => {});
          remove(ref(db, `busyUsers/${receiverSafe}`)).catch(() => {});
        }
        if (rawReceiverSafe && rawReceiverSafe !== receiverSafe) {
          remove(ref(db, `userCalls/${rawReceiverSafe}`)).catch(() => {});
        }
      } catch {}
    }

    cleanupCall(true);
  };

  // 4b. INITIATE GROUP / FLIGHT CALL
  const initiateGroupCall = async (callTitle, targetEmails = [], flightCode = null) => {
    if (!currentUser) return;
    if (activeCall) {
      alert("You are already in an active call.");
      return;
    }
    const cleanEmails = (targetEmails || []).filter(e => e && e.toLowerCase().trim() !== currentUser.email.toLowerCase().trim());
    if (cleanEmails.length === 0) {
      alert("No other staff members available to call.");
      return;
    }

    try {
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume().catch(() => {});
      }
      const streamToSend = await setupLocalAudioPipeline(selectedMicId);
      const callId = `call_grp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const callerSafe = toSafeEmail(currentUser.email);
      const rawCallerSafe = (currentUser.email || '').trim().replace(/\./g, ',');
      const callerName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.robloxUsername;

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      iceCandidatesQueue.current = [];

      streamToSend.getAudioTracks().forEach(track => pc.addTrack(track, streamToSend));

      pc.ontrack = (event) => {
        const stream = (event.streams && event.streams[0])
          ? event.streams[0]
          : new MediaStream([event.track]);
        playRemoteStream(stream);
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          push(ref(db, `calls/${callId}/callerCandidates`), event.candidate.toJSON());
        }
      };

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await pc.setLocalDescription(offer);

      const targetSafes = [];
      cleanEmails.forEach(e => {
        const sLower = toSafeEmail(e);
        const sRaw = (e || '').trim().replace(/\./g, ',');
        if (sLower && !targetSafes.includes(sLower)) targetSafes.push(sLower);
        if (sRaw && !targetSafes.includes(sRaw)) targetSafes.push(sRaw);
      });

      const callData = {
        id: callId,
        type: 'group',
        groupTitle: callTitle || (flightCode ? `Flight Call • ${flightCode}` : 'Group Voice Call'),
        flightCode: flightCode || null,
        callerEmail: currentUser.email,
        callerName,
        callerPfp: currentUser.profilePicture || '',
        callerRoblox: currentUser.robloxUsername || '',
        receiverEmail: cleanEmails[0],
        receiverName: `${cleanEmails.length} Staff Member${cleanEmails.length > 1 ? 's' : ''}`,
        members: [currentUser.email, ...cleanEmails],
        status: 'calling',
        createdAt: Date.now(),
        offer: {
          type: offer.type,
          sdp: offer.sdp
        },
        callerMuted: false,
        receiverMuted: false,
        callerDeafened: false,
        receiverDeafened: false,
        adminMuted: {}
      };

      await set(ref(db, `calls/${callId}`), callData);
      onDisconnect(ref(db, `calls/${callId}/status`)).set('ended');

      // Ring all recipients simultaneously
      await Promise.all(targetSafes.map(safe => {
        return set(ref(db, `userCalls/${safe}`), {
          callId,
          type: 'group',
          groupTitle: callData.groupTitle,
          status: 'calling',
          timestamp: Date.now(),
          callerEmail: currentUser.email,
          callerName,
          callerPfp: callData.callerPfp
        });
      }));

      // Set caller's own userCalls entry
      await set(ref(db, `userCalls/${callerSafe}`), {
        callId,
        type: 'group',
        groupTitle: callData.groupTitle,
        status: 'calling',
        timestamp: Date.now()
      });
      if (rawCallerSafe && rawCallerSafe !== callerSafe) {
        await set(ref(db, `userCalls/${rawCallerSafe}`), {
          callId,
          type: 'group',
          groupTitle: callData.groupTitle,
          status: 'calling',
          timestamp: Date.now()
        }).catch(() => {});
      }
      onDisconnect(ref(db, `userCalls/${callerSafe}`)).remove();

      // Mark caller as busy
      await set(ref(db, `busyUsers/${callerSafe}`), {
        inCall: true,
        callId,
        timestamp: Date.now()
      });
      onDisconnect(ref(db, `busyUsers/${callerSafe}`)).remove();

      setActiveCall(callData);
      setCallRole('caller');
      setCallStatus('calling');
      setIsMuted(false);
      setIsDeafened(false);

      playOutgoingCallingSound();

      callTimeoutRef.current = setTimeout(() => {
        if (callStatus === 'calling') {
          update(ref(db, `calls/${callId}`), { status: 'ended', endedAt: Date.now() });
          targetSafes.forEach(s => remove(ref(db, `userCalls/${s}`)).catch(() => {}));
          remove(ref(db, `userCalls/${callerSafe}`)).catch(() => {});
          if (rawCallerSafe && rawCallerSafe !== callerSafe) {
            remove(ref(db, `userCalls/${rawCallerSafe}`)).catch(() => {});
          }
          cleanupCall(true);
        }
      }, 45000);

    } catch (err) {
      console.error('Failed to initiate group call:', err);
      alert('Could not access microphone or initiate group call.');
      cleanupCall();
    }
  };

  // 5. MUTE / UNMUTE TOGGLE WITH SOUND
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (nextMuted) {
      playMuteSound();
    } else {
      playUnmuteSound();
    }

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isDeafened ? false : !nextMuted;
      });
    }
    if (rawLocalStreamRef.current && rawLocalStreamRef.current !== localStreamRef.current) {
      rawLocalStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isDeafened ? false : !nextMuted;
      });
    }

    if (activeCall?.id) {
      const field = callRole === 'caller' ? 'callerMuted' : 'receiverMuted';
      update(ref(db, `calls/${activeCall.id}`), { [field]: nextMuted }).catch(() => {});
    }
  };

  // 6. DEAFEN / UNDEAFEN TOGGLE WITH SOUND
  const toggleDeafen = () => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);

    if (nextDeafened) {
      playDeafenSound();
    } else {
      playUndeafenSound();
    }

    if (remoteAudioElRef.current) {
      remoteAudioElRef.current.muted = nextDeafened;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = nextDeafened ? false : !isMuted;
      });
    }
    if (rawLocalStreamRef.current && rawLocalStreamRef.current !== localStreamRef.current) {
      rawLocalStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = nextDeafened ? false : !isMuted;
      });
    }

    if (activeCall?.id) {
      const field = callRole === 'caller' ? 'callerDeafened' : 'receiverDeafened';
      update(ref(db, `calls/${activeCall.id}`), { [field]: nextDeafened }).catch(() => {});
    }
  };

  // 7. MERGE / ADD PARTICIPANT INTO ACTIVE CALL
  const mergeIntoCall = async (targetEmail, targetName) => {
    if (!activeCall?.id || !targetEmail) return;
    const cleanTargetEmail = targetEmail.trim().toLowerCase();
    const targetSafe = toSafeEmail(cleanTargetEmail);
    const rawTargetSafe = cleanTargetEmail.replace(/\./g, ',');

    let existingMembers = [];
    if (Array.isArray(activeCall.members)) {
      existingMembers = activeCall.members;
    } else if (activeCall.members && typeof activeCall.members === 'object') {
      existingMembers = Object.values(activeCall.members);
    } else {
      existingMembers = [activeCall.callerEmail, activeCall.receiverEmail].filter(Boolean);
    }

    const updatedMembers = Array.from(new Set([...existingMembers, cleanTargetEmail]));
    const currentTitle = activeCall.groupTitle || 
      `Group Call • ${activeCall.callerName || 'Staff'} & ${activeCall.receiverName || 'Staff'}`;

    try {
      await update(ref(db, `calls/${activeCall.id}`), {
        type: 'group',
        groupTitle: currentTitle,
        members: updatedMembers
      });

      const userCallPayload = {
        callId: activeCall.id,
        type: 'group',
        groupTitle: currentTitle,
        status: 'calling',
        timestamp: Date.now(),
        callerEmail: currentUser.email,
        callerName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.robloxUsername || 'Staff',
        callerPfp: currentUser.profilePicture || ''
      };

      await set(ref(db, `userCalls/${targetSafe}`), userCallPayload);
      if (rawTargetSafe && rawTargetSafe !== targetSafe) {
        await set(ref(db, `userCalls/${rawTargetSafe}`), userCallPayload).catch(() => {});
      }

      setActiveCall(prev => ({
        ...prev,
        type: 'group',
        groupTitle: currentTitle,
        members: updatedMembers
      }));
    } catch (err) {
      console.error('Failed to merge user into call:', err);
      alert('Could not merge staff member into the ongoing call.');
    }
  };

  // 8. ADMIN REMOTE MUTE PARTICIPANT
  const adminMuteParticipant = async (targetEmail) => {
    if (!currentUser?.isAdmin || !activeCall?.id || !targetEmail) return;
    const targetSafe = toSafeEmail(targetEmail);
    const updates = {
      [`adminMuted/${targetSafe}`]: Date.now()
    };
    if (activeCall.callerEmail && activeCall.callerEmail.toLowerCase() === targetEmail.toLowerCase()) {
      updates.callerMuted = true;
    }
    if (activeCall.receiverEmail && activeCall.receiverEmail.toLowerCase() === targetEmail.toLowerCase()) {
      updates.receiverMuted = true;
    }
    try {
      await update(ref(db, `calls/${activeCall.id}`), updates);
    } catch (err) {
      console.error('Failed to admin mute participant:', err);
    }
  };

  // 9. CALL WAITING: ANSWER & END CURRENT
  const answerAndEndCurrent = async () => {
    const pendingCall = incomingCall;
    if (!pendingCall) return;
    await endCall();
    setTimeout(() => {
      answerCall(pendingCall);
    }, 250);
  };

  // 10. CALL WAITING: ANSWER & PUT CURRENT ON HOLD
  const answerAndHoldCurrent = async () => {
    const pendingCall = incomingCall;
    if (!pendingCall || !activeCall) return;

    // Capture current call as heldCall
    const currentSnapshot = {
      ...activeCall,
      heldRole: callRole,
      heldDuration: callDuration
    };
    setHeldCall(currentSnapshot);

    // Notify Firebase of on-hold status
    const mySafe = toSafeEmail(currentUser.email);
    update(ref(db, `calls/${activeCall.id}/onHold/${mySafe}`), Date.now()).catch(() => {});

    // Mute hardware mic and pause remote audio from the held call
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
    }
    if (rawLocalStreamRef.current) {
      rawLocalStreamRef.current.getAudioTracks().forEach(t => t.enabled = false);
    }
    if (remoteAudioElRef.current) {
      remoteAudioElRef.current.pause();
    }
    if (pcRef.current) {
      try {
        pcRef.current.ontrack = null;
        pcRef.current.onicecandidate = null;
        pcRef.current.close();
      } catch {}
      pcRef.current = null;
    }

    // Now answer the pending call
    setTimeout(() => {
      answerCall(pendingCall);
    }, 250);
  };

  // 11. RESUME HELD CALL / SWAP BACK
  const resumeHeldCall = async () => {
    if (!heldCall) return;
    const targetHeld = heldCall;
    setHeldCall(null);

    // Clean up current active call
    if (activeCall) {
      await endCall();
    }

    const mySafe = toSafeEmail(currentUser.email);
    remove(ref(db, `calls/${targetHeld.id}/onHold/${mySafe}`)).catch(() => {});

    // Re-connect to the held call
    setTimeout(() => {
      if (targetHeld.callerEmail === currentUser.email) {
        initiateCall({
          email: targetHeld.receiverEmail,
          firstName: targetHeld.receiverName,
          robloxUsername: targetHeld.receiverRoblox
        });
      } else {
        initiateCall({
          email: targetHeld.callerEmail,
          firstName: targetHeld.callerName,
          robloxUsername: targetHeld.callerRoblox
        });
      }
    }, 300);
  };

  // 12. DECLINE WAITING CALL
  const declineWaitingCall = async () => {
    if (!incomingCall) return;
    const callId = incomingCall.id;
    const receiverSafe = toSafeEmail(currentUser.email);
    const rawReceiverSafe = (currentUser.email || '').trim().replace(/\./g, ',');
    try {
      await update(ref(db, `calls/${callId}`), {
        status: 'declined',
        endedAt: Date.now()
      });
      await remove(ref(db, `userCalls/${receiverSafe}`)).catch(() => {});
      if (rawReceiverSafe && rawReceiverSafe !== receiverSafe) {
        await remove(ref(db, `userCalls/${rawReceiverSafe}`)).catch(() => {});
      }
    } catch {}
    setIncomingCall(null);
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        callRole,
        callStatus,
        incomingCall,
        heldCall,
        adminMutedBanner,
        clearAdminMutedBanner: () => setAdminMutedBanner(false),
        isMuted,
        isDeafened,
        callDuration,
        remoteSpeaking,
        localSpeaking,
        isMinimized,
        setIsMinimized,
        // Audio Device & Volume Controls
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
        initiateCall,
        initiateGroupCall,
        answerCall,
        declineCall,
        endCall,
        toggleMute,
        toggleDeafen,
        // Merging, Admin Mute & Multi-Call Hold
        mergeIntoCall,
        adminMuteParticipant,
        answerAndEndCurrent,
        answerAndHoldCurrent,
        resumeHeldCall,
        declineWaitingCall
      }}
    >
      {children}
      <audio ref={remoteAudioElRef} autoPlay playsInline style={{ display: 'none' }} />
    </CallContext.Provider>
  );
}

export function useCall() {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
}
