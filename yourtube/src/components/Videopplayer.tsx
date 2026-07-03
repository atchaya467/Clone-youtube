"use client";

import { useRef } from "react";
import { buildApiUrl } from "@/lib/api";

interface VideoPlayerProps {
  video: {
    _id: string;
    videotitle: string;
    filepath: string;
  };
}

export default function VideoPlayer({ video }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div className="aspect-video bg-black rounded-lg overflow-hidden">
      <video
        key={video?._id}
        ref={videoRef}
        className="w-full h-full"
        controls
        src={buildApiUrl(video?.filepath)}
        poster={`/placeholder.svg?height=480&width=854`}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
