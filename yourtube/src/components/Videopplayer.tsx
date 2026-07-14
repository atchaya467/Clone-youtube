"use client";

import { useRef, useState, useEffect } from "react";
import { buildApiUrl } from "@/lib/api";
import { useUser } from "@/lib/AuthContext";
import Link from "next/link";
import { AlertCircle, ArrowUpCircle } from "lucide-react";
import { toast } from "sonner";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
  onNextVideo?: () => void;
}

export default function VideoPlayer({ video, onNextVideo }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useUser();
  const [limitExceeded, setLimitExceeded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const clickCountRef = useRef(0);
  const clickTimerRef = useRef<any>(null);
  const clickPositionRef = useRef<string | null>(null);

  const plan = user?.plan || "Free";

  // Watch limits in seconds
  const watchLimits: Record<string, number> = {
    Free: 300,   // 5 minutes
    Bronze: 420, // 7 minutes
    Silver: 600, // 10 minutes
    Gold: Infinity, // Unlimited
  };

  const limitInSeconds = watchLimits[plan] || 300;

  useEffect(() => {
    // Reset limit alert when changing videos
    setLimitExceeded(false);
  }, [video?._id]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;

    if (currentTime >= limitInSeconds) {
      videoRef.current.pause();
      setLimitExceeded(true);
    }
  };

  const handlePlay = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (limitExceeded && videoRef.current) {
      videoRef.current.pause();
    }
  };

  const executeGestureAction = (count: number, position: string | null) => {
    if (!videoRef.current || !position) return;

    if (count === 1) {
      // 1 Tap in center: Pause or resume playback
      if (position === "center") {
        if (videoRef.current.paused) {
          videoRef.current.play();
          toast.info("Play");
        } else {
          videoRef.current.pause();
          toast.info("Pause");
        }
      }
    } else if (count === 2) {
      // 2 Taps:
      // Left: 10s backward
      if (position === "left") {
        videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
        toast.info("Rewind 10s");
      }
      // Right: 10s forward
      else if (position === "right") {
        videoRef.current.currentTime = Math.min(videoRef.current.duration || Infinity, videoRef.current.currentTime + 10);
        toast.info("Fast Forward 10s");
      }
    } else if (count === 3) {
      // 3 Taps:
      // Center: Skip to next video
      if (position === "center") {
        toast.info("Skipping to next video...");
        if (onNextVideo) {
          onNextVideo();
        }
      }
      // Left: Open comments
      else if (position === "left") {
        toast.info("Opening comments section...");
        const el = document.getElementById("comments-section");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }
      // Right: Close website
      else if (position === "right") {
        toast.info("Closing website...");
        window.close();
        window.location.href = "about:blank";
      }
    }
  };

  const handlePlayerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const ratio = clickX / width;

    let position = "center";
    if (ratio < 0.33) {
      position = "left";
    } else if (ratio > 0.66) {
      position = "right";
    }

    // Reset count if clicked in a different column
    if (clickPositionRef.current !== position) {
      clickCountRef.current = 0;
      if (clickTimerRef.current) {
        clearTimeout(clickTimerRef.current);
        clickTimerRef.current = null;
      }
    }

    clickPositionRef.current = position;
    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      const finalCount = clickCountRef.current;
      const finalPosition = clickPositionRef.current;

      clickCountRef.current = 0;
      clickTimerRef.current = null;
      clickPositionRef.current = null;

      executeGestureAction(finalCount, finalPosition);
    }, 300); // 300ms window for multi-taps
  };

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden relative group">
      {limitExceeded ? (
        <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-10 animate-fade-in">
          <div className="w-16 h-16 bg-orange-500/10 text-orange-500 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Watch Limit Reached</h3>
          <p className="text-sm text-slate-400 max-w-md mb-6">
            You are currently on the <span className="text-orange-400 font-semibold">{plan} plan</span> which limits you to {limitInSeconds / 60} minutes per video.
          </p>
          <div className="flex gap-4">
            <Link
              href="/upgrade"
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-500 text-white font-semibold py-2.5 px-5 rounded-xl text-sm transition-all duration-200"
            >
              <ArrowUpCircle className="w-4 h-4" />
              Upgrade Plan
            </Link>
          </div>
        </div>
      ) : null}

      {/* Transparent Gesture Overlay (covers top 85% height to leave bottom controls bar accessible) */}
      {!limitExceeded && (
        <div
          className="absolute top-0 left-0 right-0 bottom-12 z-20 cursor-pointer"
          onClick={handlePlayerClick}
        />
      )}

      <video
        key={video?._id}
        ref={videoRef}
        className="w-full h-full object-cover"
        controls={!limitExceeded}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        src={hasError ? "/video/vdo.mp4" : buildApiUrl(video?.filepath)}
        onError={() => setHasError(true)}
        poster={`/placeholder.svg?height=480&width=854`}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
