import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { db, firebaseApp } from '../firebase';
import { ref, onValue, set, update, push, remove, getDatabase, onDisconnect } from 'firebase/database';
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
  
  // Audio Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteSpeaking, setRemoteSpeaking] = useState(false);
  const [localSpeaking, setLocalSpeaking] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // WebRTC Refs
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const remoteAudioElRef = useRef(null);
  const iceCandidatesQueue = useRef([]);
  const durationTimerRef = useRef(null);
  const callTimeoutRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserIntervalRef = useRef(null);

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
    if (analyserIntervalRef.current) {
      clearInterval(analyserIntervalRef.current);
      analyserIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }

    // Stop local media tracks
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
  };

  // Listen for incoming calls targeted to currentUser
  useEffect(() => {
    if (!currentUser?.email) return;

    const safeEmail = currentUser.email.replace(/\./g, ',');
    const userCallRef = ref(db, `userCalls/${safeEmail}`);

    const unsubscribe = onValue(userCallRef, (snapshot) => {
      const data = snapshot.val();
      if (!data || !data.callId) {
        // If pointer was removed and we were showing incoming popup, dismiss it
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
            setTimeout(() => cleanupCall(true), 1500);
          }
          return;
        }

        // Check if this is an incoming call to me and I'm not the caller
        if (callObj.receiverEmail === currentUser.email && callObj.status === 'calling') {
          // If already in a connected call with someone else, flag busy
          if (activeCall && activeCall.id !== callObj.id && callStatus === 'connected') {
            update(ref(db, `calls/${callObj.id}`), { status: 'busy', endedAt: Date.now() });
            remove(userCallRef);
            return;
          }

          // Show incoming call popup and play ringtone!
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
        setTimeout(() => {
          cleanupCall(true);
        }, 1800);
        return;
      }

      // If caller receives answer
      if (callRole === 'caller' && data.answer && pcRef.current) {
        const pc = pcRef.current;
        if (!pc.currentRemoteDescription && pc.signalingState === 'have-local-offer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
            // Flush any queued ICE candidates
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

      // Update activeCall object with remote mute/deafen states
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

  // Voice activity analyser for speaking indicator
  const setupAudioAnalyser = (stream, isLocal = false) => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const speaking = average > 18; // Threshold for voice activity
        if (isLocal) {
          setLocalSpeaking(speaking);
        } else {
          setRemoteSpeaking(speaking);
        }
      };

      if (!analyserIntervalRef.current) {
        analyserIntervalRef.current = setInterval(checkVolume, 120);
      }
    } catch (e) {
      console.debug('Audio analyser setup note:', e);
    }
  };

  // Helper to play remote stream
  const playRemoteStream = (stream) => {
    remoteStreamRef.current = stream;
    if (remoteAudioElRef.current) {
      remoteAudioElRef.current.srcObject = stream;
      remoteAudioElRef.current.muted = isDeafened;
      remoteAudioElRef.current.play().catch(err => {
        console.debug('Autoplay remote stream note:', err);
      });
    }
    setupAudioAnalyser(stream, false);
  };

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
      // Audio only - strictly NO video or screensharing
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      localStreamRef.current = stream;
      setupAudioAnalyser(stream, true);

      const callId = `call_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const callerSafe = currentUser.email.replace(/\./g, ',');
      const receiverSafe = targetUser.email.replace(/\./g, ',');

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      iceCandidatesQueue.current = [];

      // Add audio track to peer connection
      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));

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

      // Register call in DB and setup presence disconnect
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

      // Play calling sound on loop while waiting for recipient to answer
      playOutgoingCallingSound();

      // Set timeout of 45 seconds if no answer
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
      alert('Could not access your microphone. Please enable microphone permissions in your browser to make voice calls.');
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
      // Audio only - strictly NO video or screensharing
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: false
      });
      localStreamRef.current = stream;
      setupAudioAnalyser(stream, true);

      const pc = new RTCPeerConnection(ICE_SERVERS);
      pcRef.current = pc;
      iceCandidatesQueue.current = [];

      stream.getAudioTracks().forEach(track => pc.addTrack(track, stream));

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

      // Set remote offer
      await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));

      // Flush queued candidates
      while (iceCandidatesQueue.current.length > 0) {
        const candidate = iceCandidatesQueue.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.debug('Failed to add candidate during answer:', e);
        }
      }

      // Create Answer
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
      alert('Could not access your microphone. Please enable microphone permissions in your browser to join the call.');
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

    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        // If user is currently deafened, track must remain muted (disabled)
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

    // Silence remote incoming audio
    if (remoteAudioElRef.current) {
      remoteAudioElRef.current.muted = nextDeafened;
    }

    // Mute microphone when deafened (Discord standard); restore when undeafened
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
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
