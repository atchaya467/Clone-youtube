"use client";

import { useRef, useState, useEffect } from "react";
import { buildApiUrl } from "@/lib/api";
import { useUser } from "@/lib/AuthContext";
import Link from "next/link";
import { AlertCircle, ArrowUpCircle } from "lucide-react";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useUser();
  const [limitExceeded, setLimitExceeded] = useState(false);

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

      <video
        key={video?._id}
        ref={videoRef}
        className="w-full h-full"
        controls={!limitExceeded}
        onTimeUpdate={handleTimeUpdate}
        onPlay={handlePlay}
        src={buildApiUrl(video?.filepath)}
        poster={`/placeholder.svg?height=480&width=854`}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
