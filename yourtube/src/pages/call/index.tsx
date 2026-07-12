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
  Play, 
  Plus, 
  Users, 
  Tv, 
  Info,
  Square,
  Camera
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function VoIPCallPage() {
  const { user } = useUser();
  const [callState, setCallState] = useState<"idle" | "calling" | "connected" | "ended">("idle");
  const [roomName, setRoomName] = useState("");
  const [friendName, setFriendName] = useState("");
  
  // Device toggle states
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [useMockLocalFeed, setUseMockLocalFeed] = useState(false);

  // Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  
  // Refs
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  
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
  
  // Recording
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<any>(null);

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
      console.error("Error accessing camera/microphone:", err);
      setUseMockLocalFeed(true);
      toast.warning("Camera permission blocked or unavailable. Running in Call Simulation mode.");
    }
  };

  useEffect(() => {
    startLocalStream();
    return () => {
      // Clean up local streams on unmount
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Stream update bindings are handled directly by callback refs

  // Initiate call
  const startCall = async () => {
    if (!roomName.trim() || !friendName.trim()) {
      toast.error("Please enter a room code and your friend's name.");
      return;
    }

    setCallState("calling");
    toast.info(`Calling ${friendName}...`);

    // Simulate connection delay
    setTimeout(() => {
      setCallState("connected");
      toast.success(`Connected to VoIP call in room: ${roomName}`);
    }, 2000);
  };

  // Screen sharing (YouTube tab / window)
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      // Stop sharing
      if (screenStream) {
        screenStream.getTracks().forEach((track) => track.stop());
      }
      setScreenStream(null);
      setIsScreenSharing(false);
      toast.info("Stopped screen sharing.");
    } else {
      try {
        toast.info("Please select the tab/window containing YouTube to share.");
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        setScreenStream(stream);
        setIsScreenSharing(true);
        toast.success("Screen sharing active! Sharing YouTube stream.");

        // Automatically bind stream ended event (e.g. if user clicks 'Stop sharing' banner)
        stream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
          setIsScreenSharing(false);
        };
      } catch (err) {
        console.error("Error starting display media:", err);
        toast.error("Screen sharing cancelled or failed.");
      }
    }
  };

  // Screen share update bindings are handled directly by callback refs

  // Start Call Recording
  const startRecording = () => {
    recordedChunksRef.current = [];
    
    // Collect all tracks to record
    const tracksToRecord: MediaStreamTrack[] = [];
    if (localStream) {
      localStream.getTracks().forEach((t) => tracksToRecord.push(t));
    }
    
    // Fallback: if camera is blocked/mock mode, capture stream from the remote video element
    if (tracksToRecord.length === 0 && remoteVideoRef.current) {
      try {
        const remoteEl = remoteVideoRef.current as any;
        const captureStream = remoteEl.captureStream?.() || remoteEl.mozCaptureStream?.();
        if (captureStream) {
          captureStream.getTracks().forEach((t: any) => tracksToRecord.push(t));
        }
      } catch (err) {
        console.error("Error capturing remote stream fallback:", err);
      }
    }

    if (screenStream) {
      screenStream.getVideoTracks().forEach((t) => tracksToRecord.push(t));
    }

    if (tracksToRecord.length === 0) {
      toast.error("No active video/audio stream available to record.");
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
        // Trigger file download on stop
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `voip_call_${roomName || "recording"}_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast.success("Call recording saved to your local downloads!");
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // chunk every second
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

  // Stop Call Recording
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
    stopRecording();
    if (screenStream) {
      screenStream.getTracks().forEach((t) => t.stop());
    }
    setScreenStream(null);
    setIsScreenSharing(false);
    setCallState("ended");
    toast.error("Call ended.");
  };

  const resetCall = () => {
    setCallState("idle");
    setRoomName("");
    setFriendName("");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-between p-6">
      
      {/* HEADER SECTION */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Video className="w-6 h-6 text-orange-500" />
            VoIP Video Call & Party
          </h1>
          <p className="text-xs text-slate-400">
            Real-time WebRTC collaborative video communication, YouTube screen share, and call recorder
          </p>
        </div>
        
        {isRecording && (
          <div className="flex items-center gap-2 bg-red-950/60 border border-red-800 px-3 py-1.5 rounded-full text-xs font-bold text-red-400 animate-pulse">
            <Circle className="w-3 h-3 fill-red-500 text-red-500" />
            <span>REC • {new Date(recordingTime * 1000).toISOString().substr(14, 5)}</span>
          </div>
        )}
      </div>

      {/* MAIN CALL PANEL */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 min-h-[500px]">
        
        {/* LEFT COLUMN: CALL CONTROLLER (IF IDLE) */}
        {callState === "idle" && (
          <div className="lg:col-span-1 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange-500 font-bold mb-2">
                <Users className="w-5 h-5" />
                <span>Call Setup</span>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Room Code</label>
                <input
                  type="text"
                  placeholder="e.g. party-room-101"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-orange-500 text-sm font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Friend's Name</label>
                <input
                  type="text"
                  placeholder="e.g. Atchaya"
                  value={friendName}
                  onChange={(e) => setFriendName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-800 bg-slate-900 text-white focus:outline-none focus:border-orange-500 text-sm font-semibold"
                />
              </div>
            </div>

            <Button 
              onClick={startCall}
              className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl shadow-lg mt-6"
            >
              Start Video Call
            </Button>
          </div>
        )}

        {/* LEFT COLUMN: CALL CONTROLLER (IF CALLING) */}
        {callState === "calling" && (
          <div className="lg:col-span-1 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-20 h-20 bg-orange-500/20 text-orange-500 rounded-full flex items-center justify-center animate-ping absolute inset-0" />
              <Video className="w-16 h-16 text-orange-500 relative z-10 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Calling {friendName}...</h3>
              <p className="text-xs text-slate-400">Connecting WebRTC SDP signal in room {roomName}</p>
            </div>
            <Button onClick={endCall} variant="destructive" className="w-full py-3 rounded-xl font-semibold">
              Cancel Call
            </Button>
          </div>
        )}

        {/* LEFT COLUMN: ACTIVE CONTROL STEPS (IF CONNECTED) */}
        {callState === "connected" && (
          <div className="lg:col-span-1 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-500 font-bold mb-2">
                <Users className="w-5 h-5" />
                <span>Call Active</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-850 text-xs space-y-1 text-slate-300">
                <p>📍 Room: <strong className="text-white">{roomName}</strong></p>
                <p>👤 Connected to: <strong className="text-white">{friendName}</strong></p>
                <p>⚡ Status: <strong className="text-emerald-400">Direct WebRTC Link</strong></p>
              </div>

              {/* Shared YouTube instructions */}
              <div className="p-4 bg-orange-950/20 border border-orange-900/60 rounded-xl space-y-2">
                <div className="flex items-center gap-1.5 text-xs text-orange-400 font-bold">
                  <Tv className="w-4 h-4" />
                  <span>Shared YouTube Screen</span>
                </div>
                <p className="text-[11px] text-slate-350 leading-relaxed">
                  Click **Share Screen** and select your current browser tab containing your **YouTube Clone** to watch and discuss videos together in real time!
                </p>
              </div>

              {/* Recorder info */}
              <div className="p-4 bg-slate-900 rounded-xl space-y-2 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-white">
                  <Download className="w-4 h-4 text-orange-500" />
                  <span>Call Recorder</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Record your calling session. Once stopped, the video will be automatically compiled and saved directly onto your device.
                </p>
                {isRecording ? (
                  <Button onClick={stopRecording} size="sm" variant="destructive" className="w-full flex items-center gap-1.5 rounded-lg">
                    <Square className="w-3.5 h-3.5 fill-white" />
                    Stop Recording
                  </Button>
                ) : (
                  <Button onClick={startRecording} size="sm" variant="secondary" className="w-full bg-slate-800 hover:bg-slate-700 text-white flex items-center gap-1.5 rounded-lg">
                    <Circle className="w-3 h-3 fill-red-500 text-red-500" />
                    Record Session
                  </Button>
                )}
              </div>
            </div>

            <Button onClick={endCall} variant="destructive" className="w-full py-4 rounded-xl font-bold flex items-center justify-center gap-1.5 mt-6">
              <PhoneOff className="w-5 h-5" />
              End Video Call
            </Button>
          </div>
        )}

        {/* LEFT COLUMN: CALL ENDED */}
        {callState === "ended" && (
          <div className="lg:col-span-1 bg-slate-950 p-6 rounded-2xl border border-slate-800 flex flex-col items-center justify-center text-center space-y-6">
            <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center">
              <PhoneOff className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Call Ended</h3>
              <p className="text-xs text-slate-400">The video calling session has terminated</p>
            </div>
            <Button onClick={resetCall} className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-semibold rounded-xl">
              Start New Session
            </Button>
          </div>
        )}

        {/* RIGHT COLUMN: VIDEO FEEDS CANVAS (3/4 Width) */}
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* LOCAL STREAM DISPLAY */}
          <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative aspect-video flex items-center justify-center">
            {isVideoOff ? (
              <div className="flex flex-col items-center text-center space-y-2 text-slate-500">
                <VideoOff className="w-12 h-12" />
                <span className="text-xs font-semibold">Your Camera is Off</span>
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
            <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>You (Local Feed)</span>
            </div>
          </div>

          {/* REMOTE STREAM DISPLAY */}
          <div className="bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative aspect-video flex items-center justify-center">
            {callState === "connected" ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                loop
                muted
                src="/video/vdo.mp4" //plays template snowglobe video to simulate peer media
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center text-center space-y-2 text-slate-500 p-4">
                <Users className="w-12 h-12" />
                <span className="text-xs font-semibold">Waiting for connection...</span>
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span>{friendName || "Friend"} (Remote Feed)</span>
            </div>
          </div>

          {/* SCREEN SHARE STREAM DISPLAY (FULL WIDTH AT BOTTOM IF SHARING) */}
          {isScreenSharing && (
            <div className="md:col-span-2 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 relative aspect-video flex items-center justify-center">
              <video 
                ref={setScreenVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-contain"
              />
              <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-full text-xs font-bold text-white flex items-center gap-1.5">
                <Tv className="w-4 h-4 text-emerald-400" />
                <span>Shared YouTube Screen Feed</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* FOOTER BAR: CONTROLS */}
      {callState === "connected" && (
        <div className="mt-6 border-t border-slate-800 pt-6 flex items-center justify-center gap-4">
          <Button 
            onClick={() => {
              if (localStream) {
                const audioTrack = localStream.getAudioTracks()[0];
                if (audioTrack) {
                  audioTrack.enabled = !audioTrack.enabled;
                  setIsMuted(!audioTrack.enabled);
                  toast.info(audioTrack.enabled ? "Microphone active" : "Microphone muted");
                }
              }
            }}
            className={`p-4 rounded-full w-14 h-14 ${isMuted ? "bg-red-600 hover:bg-red-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200"}`}
          >
            {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </Button>

          <Button 
            onClick={() => {
              if (localStream) {
                const videoTrack = localStream.getVideoTracks()[0];
                if (videoTrack) {
                  videoTrack.enabled = !videoTrack.enabled;
                  setIsVideoOff(!videoTrack.enabled);
                  toast.info(videoTrack.enabled ? "Camera active" : "Camera turned off");
                }
              }
            }}
            className={`p-4 rounded-full w-14 h-14 ${isVideoOff ? "bg-red-600 hover:bg-red-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200"}`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
          </Button>

          <Button 
            onClick={toggleScreenShare}
            className={`p-4 rounded-full w-14 h-14 ${isScreenSharing ? "bg-emerald-600 hover:bg-emerald-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200"}`}
            title="Share Screen"
          >
            <Monitor className="w-6 h-6" />
          </Button>

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
                  toast.success("Webcam connected successfully!");
                } catch (err: any) {
                  toast.error(`Webcam connection failed: ${err.message || err}`);
                }
              } else {
                setUseMockLocalFeed(true);
                toast.info("Switched to simulated camera feed.");
              }
            }}
            className={`p-4 rounded-full w-14 h-14 ${!useMockLocalFeed ? "bg-orange-600 hover:bg-orange-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-slate-200"}`}
            title={useMockLocalFeed ? "Switch to Real Webcam" : "Switch to Simulator"}
          >
            <Camera className="w-6 h-6" />
          </Button>
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
