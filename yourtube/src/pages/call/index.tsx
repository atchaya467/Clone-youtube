"use client";

import React, { useState, useRef, useEffect } from "react";
import { useUser } from "@/lib/AuthContext";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  PhoneOff, 
  Circle, 
  Download, 
  Users, 
  Tv, 
  Square,
  Camera,
  MessageSquare,
  Send,
  X,
  Volume2,
  VolumeX,
  Settings,
  PhoneCall,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ChatMessage {
  sender: string;
  text: string;
  time: string;
}

export default function VoIPCallPage() {
  const { user } = useUser();
  const [callState, setCallState] = useState<"idle" | "calling" | "connected" | "ended">("idle");
  const [roomName, setRoomName] = useState("");
  const [friendName, setFriendName] = useState("");
  
  // Device & HUD states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [useMockLocalFeed, setUseMockLocalFeed] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isPipFloating, setIsPipFloating] = useState(true);
  
  // Speakers talking animation state
  const [isFriendSpeaking, setIsFriendSpeaking] = useState(false);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);

  // Chat message logs
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");

  // Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  
  // Refs
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringtoneIntervalRef = useRef<any>(null);
  
  // Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

  // Audio chimes synthesiser using Web Audio API
  const playSynthesizedChime = (notes: number[], type: OscillatorType = "sine", duration = 0.15) => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      let time = ctx.currentTime;
      notes.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gainNode = ctx.createGain();
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.type = type;
        osc.frequency.setValueAtTime(freq, time);

        gainNode.gain.setValueAtTime(0.12, time);
        gainNode.gain.exponentialRampToValueAtTime(0.001, time + duration);

        osc.start(time);
        osc.stop(time + duration);
        time += duration * 0.8;
      });
    } catch (e) {
      console.warn("Audio Context is blocked or not supported on this browser.", e);
    }
  };

  // Ringtone generator during outgoing call
  const startRingtone = () => {
    stopRingtone();
    ringtoneIntervalRef.current = setInterval(() => {
      // Classic dual-tone telephone ringing frequency (440Hz + 480Hz)
      playSynthesizedChime([440, 480], "sine", 0.3);
      setTimeout(() => {
        playSynthesizedChime([440, 480], "sine", 0.3);
      }, 400);
    }, 2000);
  };

  const stopRingtone = () => {
    if (ringtoneIntervalRef.current) {
      clearInterval(ringtoneIntervalRef.current);
    }
  };

  // Request camera and microphone stream on load
  const startLocalStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      setLocalStream(stream);
      setUseMockLocalFeed(false);
    } catch (err) {
      console.warn("webcam stream denied or not found:", err);
      setUseMockLocalFeed(true);
    }
  };

  useEffect(() => {
    startLocalStream();
    return () => {
      stopRingtone();
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Callback Refs to guarantee immediate srcObject binding
  const setLocalVideoRef = (el: HTMLVideoElement | null) => {
    if (el && localStream) {
      el.srcObject = localStream;
    }
  };

  const setScreenVideoRef = (el: HTMLVideoElement | null) => {
    if (el && screenStream) {
      el.srcObject = screenStream;
    }
  };

  // Initiate call
  const startCall = async () => {
    if (!roomName.trim() || !friendName.trim()) {
      toast.error("Please enter a room code and your friend's name.");
      return;
    }

    setCallState("calling");
    toast.info(`Calling ${friendName}...`);
    startRingtone();

    // Simulate connection delay
    setTimeout(() => {
      stopRingtone();
      setCallState("connected");
      // Connected chime (ascending major chord)
      playSynthesizedChime([261.63, 329.63, 392.00, 523.25], "triangle", 0.18);
      toast.success(`Connected to VoIP call with ${friendName}`);
      
      // Simulate chat greetings from friend
      setTimeout(() => {
        setChatMessages((prev) => [
          ...prev,
          {
            sender: friendName,
            text: `Hey! I'm in room ${roomName}. Ready to share screen and watch YouTube?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 1500);
    }, 2800);
  };

  // Simulate speaking indicator loops
  useEffect(() => {
    if (callState !== "connected") return;
    
    // Simulate remote friend speaking occasionally
    const interval = setInterval(() => {
      setIsFriendSpeaking(Math.random() > 0.6);
    }, 1800);

    return () => clearInterval(interval);
  }, [callState]);

  useEffect(() => {
    if (callState !== "connected") return;
    
    // Simulate local user speaking indicator if not muted
    const interval = setInterval(() => {
      setIsLocalSpeaking(!isMuted && Math.random() > 0.7);
    }, 1500);

    return () => clearInterval(interval);
  }, [callState, isMuted]);

  // Screen sharing (YouTube tab / window)
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      setScreenStream(null);
      setIsScreenSharing(false);
      toast.info("Stopped screen sharing.");
    } else {
      try {
        toast.info("Please select the tab containing YouTube to watch together.");
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);
        toast.success("Screen sharing active!");

        stream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.error("Error starting display media:", err);
        toast.error("Screen sharing cancelled.");
      }
    }
  };

  // Start Call Recording
  const startRecording = () => {
    recordedChunksRef.current = [];
    const tracksToRecord: MediaStreamTrack[] = [];
    
    if (localStream) {
      localStream.getTracks().forEach((t) => tracksToRecord.push(t));
    }
    
    // Fallback: capture from remote snowglobe element if webcam is blocked
    if (tracksToRecord.length === 0 && remoteVideoRef.current) {
      try {
        const remoteEl = remoteVideoRef.current as any;
        const captureStream = remoteEl.captureStream?.() || remoteEl.mozCaptureStream?.();
        if (captureStream) {
          captureStream.getTracks().forEach((t: any) => tracksToRecord.push(t));
        }
      } catch (err) {
        console.error("Error capturing remote stream:", err);
      }
    }

    if (screenStream) {
      screenStream.getVideoTracks().forEach((t) => tracksToRecord.push(t));
    }

    if (tracksToRecord.length === 0) {
      toast.error("No active stream found to record.");
      return;
    }

    const streamToRecord = new MediaStream(tracksToRecord);
    
    try {
      const options = { mimeType: "video/webm;codecs=vp9" };
      const mediaRecorder = new MediaRecorder(streamToRecord, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `call_session_${roomName || "recording"}_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Call recording saved to your local downloads!");
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000);
      setIsRecording(true);
      setRecordingTime(0);
      toast.success("Recording session started.");

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (e) {
      console.error("Error creating MediaRecorder:", e);
      toast.error("Recording not supported on this browser.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    }
  };

  const endCall = () => {
    stopRingtone();
    stopRecording();
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    setScreenStream(null);
    setIsScreenSharing(false);
    setCallState("ended");
    // End chime (descending note sequence)
    playSynthesizedChime([392.00, 329.63, 261.63, 196.00], "sine", 0.22);
    toast.error("Call ended.");
  };

  const resetCall = () => {
    setCallState("idle");
    setRoomName("");
    setFriendName("");
    setChatMessages([]);
  };

  // Handle message send in chat
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setChatMessages((prev) => [
      ...prev,
      {
        sender: user?.name || "You",
        text: newMessage.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setNewMessage("");

    // Simulate simulated friend replying in 1.5 seconds
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: friendName || "Friend",
          text: "Yeah, this looks awesome! The lag is very low.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between overflow-hidden relative">
      
      {/* 1. MOCK INCOMING SETUP VIEW */}
      {callState === "idle" && (
        <div className="flex-1 flex items-center justify-center p-6 relative">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 animate-pulse" />
            
            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center">
                <Video className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Join VoIP Video Call</h1>
                <p className="text-xs text-slate-400 mt-1">Start watch party calls with live screen share and recording</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Room Code</label>
                <input
                  type="text"
                  placeholder="e.g. party-room-101"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-slate-950 text-white focus:outline-none focus:border-orange-500 text-sm font-semibold transition-all duration-200"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">Friend's Name</label>
                <input
                  type="text"
                  placeholder="e.g. Nisha"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-850 bg-slate-950 text-white focus:outline-none focus:border-orange-500 text-sm font-semibold transition-all duration-200"
                />
              </div>

              <Button 
                onClick={startCall}
                className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg mt-6 flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-5 h-5" />
                <span>Start Call Room</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CALLING / RINGING VIEW */}
      {callState === "calling" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="relative">
            <div className="w-24 h-24 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center animate-ping absolute inset-0" />
            <div className="w-24 h-24 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center relative z-10">
              <Video className="w-10 h-10 text-orange-500 animate-pulse" />
            </div>
          </div>
          
          <div className="text-center space-y-1">
            <h3 className="text-2xl font-black text-white">Calling {friendName}...</h3>
            <p className="text-sm text-slate-400">Initiating WebRTC handshake in room {roomName}</p>
            <p className="text-xs text-orange-500 animate-pulse mt-2">☎️ Ringing...</p>
          </div>

          <Button onClick={endCall} variant="destructive" className="px-8 py-3 rounded-xl font-bold mt-4 shadow-lg">
            Cancel Call
          </Button>
        </div>
      )}

      {/* 3. ACTIVE CONNECTED MEET VIEW */}
      {callState === "connected" && (
        <div className="flex-1 flex flex-row relative h-[calc(100vh-88px)]">
          
          {/* THE MAIN VIDEO CANVAS AREA */}
          <div className="flex-1 bg-slate-950 relative overflow-hidden flex items-center justify-center">
            
            {/* BACKGROUND: REMOTE PEER VIDEO (OR SCREEN SHARE FEED) */}
            <div className="absolute inset-0 z-0">
              {isScreenSharing && screenStream ? (
                // Screen share is active, remote feed moves to floating PiP, screen share takes main background
                <video 
                  ref={setScreenVideoRef}
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-contain bg-black"
                />
              ) : (
                // Normal view: remote video loop occupies the full screen
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  loop
                  muted
                  src="/video/vdo.mp4"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* NAME TAG & MIC STATE OVERLAY (REMOTE PEER) */}
            <div className="absolute bottom-6 left-6 z-10 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-slate-850">
              <div className="relative">
                {isFriendSpeaking && (
                  <span className="absolute -inset-1 rounded-full bg-emerald-500/40 animate-ping" />
                )}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white ${isFriendSpeaking ? "bg-emerald-600" : "bg-blue-600"}`}>
                  {friendName.charAt(0).toUpperCase()}
                </div>
              </div>
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{isScreenSharing ? `${friendName} (Screen Shared)` : friendName}</span>
                  {isFriendSpeaking && <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />}
                </div>
                <span className="text-[10px] text-slate-400">Remote Participant</span>
              </div>
            </div>

            {/* FLOATING LOCAL VIDEO PiP WINDOW */}
            {isPipFloating && (
              <div className="absolute top-6 right-6 w-48 aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-750 shadow-2xl z-20 transition-all duration-300">
                {isVideoOff ? (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-950">
                    <VideoOff className="w-6 h-6" />
                    <span className="text-[9px] font-bold mt-1">Camera Off</span>
                  </div>
                ) : useMockLocalFeed ? (
                  <video 
                    src="/video/vdo.mp4"
                    autoPlay 
                    playsInline 
                    loop
                    muted 
                    className="w-full h-full object-cover mirror"
                  />
                ) : (
                  <video 
                    ref={setLocalVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover mirror"
                  />
                )}
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded-lg text-[9px] font-extrabold text-white flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${isLocalSpeaking ? "bg-emerald-500 animate-pulse" : "bg-orange-500"}`} />
                  <span>You</span>
                </div>
              </div>
            )}

            {/* IF SCREEN IS SHARING: DISPLAY REMOTE USER PiP TOO */}
            {isScreenSharing && (
              <div className="absolute top-6 left-6 w-44 aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-750 shadow-2xl z-20">
                <video
                  autoPlay
                  playsInline
                  loop
                  muted
                  src="/video/vdo.mp4"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded-lg text-[9px] font-extrabold text-white">
                  <span>{friendName}</span>
                </div>
              </div>
            )}

            {/* RECORDING / REC PULSING OVERLAY */}
            {isRecording && (
              <div className="absolute top-6 left-6 z-20 flex items-center gap-2 bg-red-950/80 border border-red-800 px-3 py-1.5 rounded-full text-[10px] font-bold text-red-400 animate-pulse">
                <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" />
                <span>REC • {new Date(recordingTime * 1000).toISOString().substr(14, 5)}</span>
              </div>
            )}

          </div>

          {/* RIGHT SIDEBAR: CHAT PANEL */}
          {isChatOpen && (
            <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col justify-between h-full z-10">
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <MessageSquare className="w-4 h-4 text-orange-500" />
                  <span>Meeting Chat</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="text-slate-400 hover:text-white rounded-lg">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Chat Message Logs */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/30">
                {chatMessages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 space-y-2">
                    <MessageSquare className="w-8 h-8 opacity-40" />
                    <p className="text-xs">No messages yet. Send a message to start watch party discussion!</p>
                  </div>
                ) : (
                  chatMessages.map((msg, index) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between text-[10px] font-semibold text-slate-400">
                        <span>{msg.sender}</span>
                        <span>{msg.time}</span>
                      </div>
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850 text-xs text-white max-w-[90%] break-words">
                        {msg.text}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input Field */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-900 flex gap-2">
                <input
                  type="text"
                  placeholder="Type message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-orange-500"
                />
                <Button type="submit" size="icon" className="bg-orange-600 hover:bg-orange-500 text-white rounded-xl">
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          )}

        </div>
      )}

      {/* 4. CALL ENDED SCREEN */}
      {callState === "ended" && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">
          <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
            <PhoneOff className="w-10 h-10" />
          </div>
          <div className="space-y-1 text-center">
            <h3 className="text-2xl font-black text-white">Call Ended</h3>
            <p className="text-xs text-slate-400">Your video session with {friendName || "Nisha"} has terminated</p>
          </div>
          <Button onClick={resetCall} className="px-8 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg">
            Return to Setup
          </Button>
        </div>
      )}

      {/* HUD BOTTOM BAR: FLOATING CLASSIC MEETING CONTROLS */}
      {callState === "connected" && (
        <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex justify-between items-center z-20">
          
          {/* LEFT: MEETING DETAILS */}
          <div className="hidden md:flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <p className="text-xs font-bold text-white">Live Call: {roomName}</p>
              <p className="text-[10px] text-slate-400">With {friendName} • Secure P2P</p>
            </div>
          </div>

          {/* CENTER: INTERACTIVE SYSTEM CONTROLS */}
          <div className="flex items-center gap-3 mx-auto md:mx-0">
            {/* Mic Button */}
            <Button 
              onClick={() => {
                if (localStream) {
                  const audioTrack = localStream.getAudioTracks()[0];
                  if (audioTrack) {
                    audioTrack.enabled = !audioTrack.enabled;
                    setIsMuted(!audioTrack.enabled);
                    toast.info(audioTrack.enabled ? "Microphone active" : "Microphone muted");
                  }
                } else {
                  setIsMuted(!isMuted);
                }
              }}
              className={`p-3 rounded-xl w-11 h-11 ${isMuted ? "bg-red-600 hover:bg-red-500 text-white" : "bg-slate-800 hover:bg-slate-750 text-slate-200"}`}
              title={isMuted ? "Unmute Mic" : "Mute Mic"}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            {/* Video Toggle */}
            <Button 
              onClick={() => {
                if (localStream) {
                  const videoTrack = localStream.getVideoTracks()[0];
                  if (videoTrack) {
                    videoTrack.enabled = !videoTrack.enabled;
                    setIsVideoOff(!videoTrack.enabled);
                    toast.info(videoTrack.enabled ? "Camera active" : "Camera turned off");
                  }
                } else {
                  setIsVideoOff(!isVideoOff);
                }
              }}
              className={`p-3 rounded-xl w-11 h-11 ${isVideoOff ? "bg-red-600 hover:bg-red-500 text-white" : "bg-slate-800 hover:bg-slate-750 text-slate-200"}`}
              title={isVideoOff ? "Turn Video On" : "Turn Video Off"}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </Button>

            {/* Camera Simulation Swap button */}
            <Button 
              onClick={async () => {
                if (useMockLocalFeed) {
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({
                      video: true,
                      audio: true,
                    });
                    setLocalStream(stream);
                    setUseMockLocalFeed(false);
                    toast.success("Webcam connected!");
                  } catch (err: any) {
                    toast.error(`Webcam error: ${err.message || err}`);
                  }
                } else {
                  setUseMockLocalFeed(true);
                  toast.info("Switched to simulator loop.");
                }
              }}
              className={`p-3 rounded-xl w-11 h-11 ${!useMockLocalFeed ? "bg-orange-600 hover:bg-orange-550 text-white" : "bg-slate-800 hover:bg-slate-750 text-slate-200"}`}
              title={useMockLocalFeed ? "Force Real Webcam" : "Swap to Simulator"}
            >
              <Camera className="w-5 h-5" />
            </Button>

            {/* Screen Share button */}
            <Button 
              onClick={toggleScreenShare}
              className={`p-3 rounded-xl w-11 h-11 ${isScreenSharing ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-slate-800 hover:bg-slate-750 text-slate-200"}`}
              title="Share Screen"
            >
              <Monitor className="w-5 h-5" />
            </Button>

            {/* Session Recording button */}
            {isRecording ? (
              <Button onClick={stopRecording} className="p-3 bg-red-600 hover:bg-red-500 text-white rounded-xl w-11 h-11" title="Stop Recording">
                <Square className="w-4 h-4 fill-white" />
              </Button>
            ) : (
              <Button onClick={startRecording} className="p-3 bg-slate-800 hover:bg-slate-750 text-slate-200 rounded-xl w-11 h-11" title="Record Meeting">
                <Circle className="w-3.5 h-3.5 fill-red-500 text-red-500" />
              </Button>
            )}

            {/* HANG UP BUTTON */}
            <Button onClick={endCall} variant="destructive" className="px-5 rounded-xl h-11 font-bold flex items-center gap-1.5 shadow-lg bg-red-600 hover:bg-red-500">
              <PhoneOff className="w-5 h-5" />
              <span className="hidden sm:inline">Leave</span>
            </Button>
          </div>

          {/* RIGHT: CHAT AND PANEL TOGGLES */}
          <div className="hidden md:flex items-center gap-3">
            <Button 
              onClick={() => setIsChatOpen(!isChatOpen)}
              className={`p-3 rounded-xl w-11 h-11 ${isChatOpen ? "bg-orange-600 text-white hover:bg-orange-500" : "bg-slate-800 hover:bg-slate-750 text-slate-200"}`}
              title="Toggle Chat"
            >
              <MessageSquare className="w-5 h-5" />
            </Button>
            <Button 
              onClick={() => setIsPipFloating(!isPipFloating)}
              className={`p-3 rounded-xl w-11 h-11 ${isPipFloating ? "bg-orange-600 text-white hover:bg-orange-500" : "bg-slate-800 hover:bg-slate-750 text-slate-200"}`}
              title="Toggle Your PiP View"
            >
              <Tv className="w-5 h-5" />
            </Button>
          </div>

        </div>
      )}

      <style jsx global>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}
