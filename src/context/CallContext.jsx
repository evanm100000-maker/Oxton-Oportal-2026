import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, firebaseApp } from '../firebase';
import { ref, onValue, set, update, push, remove, onDisconnect } from 'firebase/database';
import { useApp } from './AppContext';
import { 
  playIncomingRingtone, 
  stopIncomingRingtone, 
  playOutgoingCallingSound, 
  stopOutgoingCallingSound, 
  playCallEndSound 
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

export function CallProvider({ children }) {
  const { currentUser } = useApp();
  
  // Call States
  const [activeCall, setActiveCall] = useState(null);
  const [callRole, setCallRole] = useState(null); // 'caller' | 'receiver' | null
  const [callStatus, setCallStatus] = useState('idle'); // 'idle' | 'calling' | 'connected' | 'declined' | 'ended'
  const [incomingCall, setIncomingCall] = useState(null);
  
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
  
  // Web Audio Nodes
  const audioContextRef = useRef(null);
  const micGainNodeRef = useRef(null);
  const remoteGainNodeRef = useRef(null);
  const localAnalyserRef = useRef(null);
  const remoteAnalyserRef = useRef(null);
  const meterIntervalRef = useRef(null);

  // Initialize hidden remote audio element
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = new Audio();
      audio.autoplay = true;
      audio.playsInline = true;
      remoteAudioElRef.current = audio;
    }
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

  // Update Peer Volume
  const setPeerVolume = (vol) => {
    const num = Math.max(0, Math.min(200, Number(vol)));
    setPeerVolumeState(num);
    try { localStorage.setItem('oxton_peer_volume', num.toString()); } catch {}

    if (remoteGainNodeRef.current) {
      remoteGainNodeRef.current.gain.value = isDeafened ? 0 : num / 100;
    }
    if (remoteAudioElRef.current) {
      remoteAudioElRef.current.volume = Math.min(1, num / 100);
    }
  };

  // Update Mic Volume (Input Gain)
  const setMicVolume = (vol) => {
    const num = Math.max(0, Math.min(200, Number(vol)));
    setMicVolumeState(num);
    try { localStorage.setItem('oxton_mic_volume', num.toString()); } catch {}

    if (micGainNodeRef.current) {
      micGainNodeRef.current.gain.value = num / 100;
    }
  };

  // Change Microphone Device
  const changeMicrophone = async (deviceId) => {
    setSelectedMicId(deviceId);
    try { localStorage.setItem('oxton_selected_mic', deviceId); } catch {}

    // If currently in a call, switch microphone track live!
    if (rawLocalStreamRef.current && pcRef.current) {
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
        rawLocalStreamRef.current.getTracks().forEach(t => t.stop());
        rawLocalStreamRef.current = newStream;

        const newRawTrack = newStream.getAudioTracks()[0];
        if (newRawTrack) {
          newRawTrack.enabled = isDeafened ? false : !isMuted;
        }

        // Reconnect into Web Audio gain node if active
        if (audioContextRef.current && micGainNodeRef.current) {
          try {
            const ctx = audioContextRef.current;
            const newSource = ctx.createMediaStreamSource(newStream);
            newSource.connect(micGainNodeRef.current);
          } catch (e) {
            console.debug('Failed to reconnect Web Audio source on device change:', e);
          }
        }

        // Replace track on WebRTC RTCRtpSender
        const sender = pcRef.current.getSenders().find(s => s.track && s.track.kind === 'audio');
        if (sender) {
          // If using Web Audio destination stream, replace with destination track or raw track
          const trackToSend = localStreamRef.current?.getAudioTracks()[0] || newRawTrack;
          if (trackToSend) {
            await sender.replaceTrack(trackToSend);
          }
        }
      } catch (err) {
        console.error('Failed to change microphone mid-call:', err);
      }
    }
  };

  // Setup Web Audio graph for local microphone with volume gain
  const setupLocalAudioPipeline = async (deviceIdToUse) => {
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

    // Refresh devices list since permissions are now granted
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

        const source = ctx.createMediaStreamSource(rawStream);
        const gainNode = ctx.createGain();
        gainNode.gain.value = micVolume / 100;
        micGainNodeRef.current = gainNode;

        const dest = ctx.createMediaStreamDestination();
        source.connect(gainNode);
        gainNode.connect(dest);

        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        gainNode.connect(analyser);
        localAnalyserRef.current = analyser;

        startMeters();

        // Use the gain-controlled stream for WebRTC transmission
        localStreamRef.current = dest.stream;
        return dest.stream;
      }
    } catch (err) {
      console.debug('Web Audio local pipeline setup fallback to raw stream:', err);
    }

    localStreamRef.current = rawStream;
    return rawStream;
  };

  // Setup Web Audio graph for remote peer with volume gain
  const playRemoteStream = (stream) => {
    remoteStreamRef.current = stream;

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

        const remoteSource = ctx.createMediaStreamSource(stream);
        const remoteGain = ctx.createGain();
        remoteGain.gain.value = isDeafened ? 0 : peerVolume / 100;
        remoteGainNodeRef.current = remoteGain;

        remoteGain.connect(ctx.destination);

        const remoteAnalyser = ctx.createAnalyser();
        remoteAnalyser.fftSize = 256;
        remoteGain.connect(remoteAnalyser);
        remoteAnalyserRef.current = remoteAnalyser;

        startMeters();
        return;
      }
    } catch (err) {
      console.debug('Web Audio remote pipeline fallback:', err);
    }

    // Fallback to HTMLAudioElement
    if (remoteAudioElRef.current) {
      remoteAudioElRef.current.srcObject = stream;
      remoteAudioElRef.current.volume = Math.min(1, peerVolume / 100);
      remoteAudioElRef.current.muted = isDeafened;
      remoteAudioElRef.current.play().catch(err => {
        console.debug('Autoplay remote stream note:', err);
      });
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
        const level = Math.min(100, Math.round((avg / 128) * 100));
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

    micGainNodeRef.current = null;
    remoteGainNodeRef.current = null;
    localAnalyserRef.current = null;
    remoteAnalyserRef.current = null;

    // Stop raw media tracks
    if (rawLocalStreamRef.current) {
      try {
        rawLocalStreamRef.current.getTracks().forEach(track => track.stop());
      } catch {}
      rawLocalStreamRef.current = null;
    }

    if (localStreamRef.current) {
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
      } catch {}
    }

    remoteStreamRef.current = null;
    iceCandidatesQueue.current = [];

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
  };

  // Listen for incoming calls targeted to currentUser
  useEffect(() => {
    if (!currentUser?.email) return;

    const safeEmail = currentUser.email.replace(/\./g, ',');
    const userCallRef = ref(db, `userCalls/${safeEmail}`);

    const unsubscribe = onValue(userCallRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || !data.callId) {
        setIncomingCall(prev => {
          if (prev) stopIncomingRingtone();
          return null;
        });
        return;
      }

      // Fetch the full call object
      const callDataRef = ref(db, `calls/${data.callId}`);
      onValue(callDataRef, (callSnap) => {
        const callObj = callSnap.val();
        if (!callObj) return;

        // If call was ended or declined
        if (callObj.status === 'ended' || callObj.status === 'declined') {
          if (incomingCall && incomingCall.id === callObj.id) {
            stopIncomingRingtone();
            setIncomingCall(null);
          }
          if (activeCall && activeCall.id === callObj.id) {
            setCallStatus(callObj.status);
            playCallEndSound();
            setTimeout(() => cleanupCall(false), 1500);
          }
          return;
        }

        // Check if this is an incoming call to me and I'm not the caller
        if (callObj.receiverEmail === currentUser.email && callObj.status === 'calling') {
          if (activeCall && activeCall.id !== callObj.id && callStatus === 'connected') {
            update(ref(db, `calls/${callObj.id}`), { status: 'busy', endedAt: Date.now() });
            remove(userCallRef);
            return;
          }

          setIncomingCall(callObj);
          playIncomingRingtone();
        }
      }, { onlyOnce: false });
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.email, activeCall?.id, callStatus]);

  // Synchronize active call updates (remote mute, deafen, answer, end)
  useEffect(() => {
    if (!activeCall?.id || !currentUser?.email) return;

    const callRef = ref(db, `calls/${activeCall.id}`);
    const unsubscribe = onValue(callRef, async (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

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
      const streamToSend = await setupLocalAudioPipeline(selectedMicId);

      const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const callerSafe = currentUser.email.replace(/\./g, ',');
      const receiverSafe = targetUser.email.replace(/\./g, ',');

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      iceCandidatesQueue.current = [];

      streamToSend.getAudioTracks().forEach(track => pc.addTrack(track, streamToSend));

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          playRemoteStream(event.streams[0]);
        }
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
        callerName: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() || currentUser.robloxUsername,
        callerPfp: currentUser.profilePicture || '',
        callerRoblox: currentUser.robloxUsername || '',
        receiverEmail: targetUser.email,
        receiverName: `${targetUser.firstName} ${targetUser.lastName || ''}`.trim() || targetUser.robloxUsername,
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
        receiverDeafened: false
      };

      await set(ref(db, `calls/${callId}`), callData);
      onDisconnect(ref(db, `calls/${callId}/status`)).set('ended');

      await set(ref(db, `userCalls/${receiverSafe}`), {
        callId,
        status: 'calling',
        timestamp: Date.now(),
        callerEmail: currentUser.email,
        callerName: callData.callerName,
        callerPfp: callData.callerPfp
      });
      onDisconnect(ref(db, `userCalls/${receiverSafe}`)).remove();

      await set(ref(db, `userCalls/${callerSafe}`), {
        callId,
        status: 'calling',
        timestamp: Date.now()
      });
      onDisconnect(ref(db, `userCalls/${callerSafe}`)).remove();

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
  const answerCall = async () => {
    if (!incomingCall) return;
    stopIncomingRingtone();
    const callId = incomingCall.id;
    const receiverSafe = currentUser.email.replace(/\./g, ',');

    try {
      const streamToSend = await setupLocalAudioPipeline(selectedMicId);

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      iceCandidatesQueue.current = [];

      streamToSend.getAudioTracks().forEach(track => pc.addTrack(track, streamToSend));

      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          playRemoteStream(event.streams[0]);
        }
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          push(ref(db, `calls/${callId}/receiverCandidates`), event.candidate.toJSON());
        }
      };

      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

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

      await update(ref(db, `userCalls/${receiverSafe}`), { status: 'connected' });

      setActiveCall({ ...incomingCall, status: 'connected' });
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
    const receiverSafe = currentUser.email.replace(/\./g, ',');

    try {
      await update(ref(db, `calls/${callId}`), {
        status: 'declined',
        endedAt: Date.now()
      });
      await remove(ref(db, `userCalls/${receiverSafe}`));
    } catch {}

    setIncomingCall(null);
  };

  // 4. END CALL (Either party)
  const endCall = async () => {
    stopIncomingRingtone();
    stopOutgoingCallingSound();

    if (activeCall) {
      const callId = activeCall.id;
      const callerSafe = (activeCall.callerEmail || '').replace(/\./g, ',');
      const receiverSafe = (activeCall.receiverEmail || '').replace(/\./g, ',');

      try {
        await update(ref(db, `calls/${callId}`), {
          status: 'ended',
          endedAt: Date.now()
        });
        if (callerSafe) remove(ref(db, `userCalls/${callerSafe}`)).catch(() => {});
        if (receiverSafe) remove(ref(db, `userCalls/${receiverSafe}`)).catch(() => {});
      } catch {}
    }

    cleanupCall(true);
  };

  // 5. MUTE / UNMUTE TOGGLE
  const toggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    if (rawLocalStreamRef.current) {
      rawLocalStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isDeafened ? false : !nextMuted;
      });
    }

    if (activeCall?.id) {
      const field = callRole === 'caller' ? 'callerMuted' : 'receiverMuted';
      update(ref(db, `calls/${activeCall.id}`), { [field]: nextMuted }).catch(() => {});
    }
  };

  // 6. DEAFEN / UNDEAFEN TOGGLE
  const toggleDeafen = () => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);

    if (remoteGainNodeRef.current) {
      remoteGainNodeRef.current.gain.value = nextDeafened ? 0 : peerVolume / 100;
    }
    if (remoteAudioElRef.current) {
      remoteAudioElRef.current.muted = nextDeafened;
    }

    if (rawLocalStreamRef.current) {
      rawLocalStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = nextDeafened ? false : !isMuted;
      });
    }

    if (activeCall?.id) {
      const field = callRole === 'caller' ? 'callerDeafened' : 'receiverDeafened';
      update(ref(db, `calls/${activeCall.id}`), { [field]: nextDeafened }).catch(() => {});
    }
  };

  return (
    <CallContext.Provider
      value={{
        activeCall,
        callRole,
        callStatus,
        incomingCall,
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
        answerCall,
        declineCall,
        endCall,
        toggleMute,
        toggleDeafen
      }}
    >
      {children}
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
