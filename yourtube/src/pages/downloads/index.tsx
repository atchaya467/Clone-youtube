import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Download, Play, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import axiosInstance from "@/lib/axiosinstance";
import { useUser } from "@/lib/AuthContext";
import { buildApiUrl } from "@/lib/api";

export default function DownloadsPage() {
  const [downloadedVideos, setDownloadedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      loadDownloads();
    } else {
      setLoading(false);
    }
  }, [user]);

  const loadDownloads = async () => {
    if (!user) return;

    try {
      // Fetch the unique videos downloaded by this user
      const response = await axiosInstance.get(`/download/user/${user?._id}`);
      setDownloadedVideos(response.data);
    } catch (error) {
      console.error("Error loading downloaded videos:", error);
    } finally {
      setLoading(false);
    }
  };

  const triggerFileDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Error downloading file via blob, falling back to window.open", error);
      window.open(url, "_blank");
    }
  };

  if (loading) {
    return (
      <main className="flex-1 p-6">
        <div className="max-w-4xl animate-pulse text-gray-500 font-medium text-center py-12">
          Loading downloads...
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex-1 p-6 flex flex-col items-center justify-center text-center py-24">
        <Download className="w-16 h-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold mb-2">Access your offline downloads</h2>
        <p className="text-gray-600 mb-4">
          Please sign in to view and download your saved offline videos.
        </p>
      </main>
    );
  }

  return (
    <main className="flex-1 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Download className="w-6 h-6 text-orange-600" />
          Offline Downloads
        </h1>

        {downloadedVideos.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 border border-dashed rounded-lg">
            <Video className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">No downloaded videos</h2>
            <p className="text-gray-600 max-w-sm mx-auto">
              Videos you download will appear here. Go to any video page and click the Download button.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 font-medium">
              {downloadedVideos.length} video{downloadedVideos.length > 1 ? "s" : ""} available
            </p>

            <div className="space-y-4">
              {downloadedVideos.map((video) => (
                <div key={video._id} className="flex flex-col sm:flex-row gap-4 p-3 hover:bg-gray-50 rounded-lg border transition-colors group">
                  <Link href={`/watch/${video._id}`} className="flex-shrink-0">
                    <div className="relative w-full sm:w-48 aspect-video bg-gray-100 rounded overflow-hidden shadow-sm">
                      <video
                        src={buildApiUrl(video.filepath || "/video/vdo.mp4")}
                        className="object-cover w-full h-full group-hover:scale-102 transition-transform duration-200"
                        onError={(e) => {
                          const target = e.target as HTMLVideoElement;
                          if (!target.src.includes("/video/vdo.mp4")) {
                            target.src = "/video/vdo.mp4";
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="bg-white/95 text-black p-2 rounded-full shadow-lg">
                          <Play className="w-5 h-5 fill-black" />
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                    <div>
                      <Link href={`/watch/${video._id}`}>
                        <h3 className="font-bold text-base line-clamp-2 hover:text-orange-600 mb-1 leading-snug">
                          {video.videotitle}
                        </h3>
                      </Link>
                      <p className="text-sm text-gray-600 font-medium mb-1">
                        {video.videochanel}
                      </p>
                      <p className="text-xs text-gray-500">
                        {video.views?.toLocaleString() || 0} views •{" "}
                        {video.createdAt ? formatDistanceToNow(new Date(video.createdAt)) : "some time"} ago
                      </p>
                    </div>

                    <div className="flex items-center gap-2 mt-3 sm:mt-0">
                      <Link href={`/watch/${video._id}`}>
                        <Button variant="default" size="sm" className="bg-orange-600 hover:bg-orange-700 text-white font-medium flex items-center gap-1.5 rounded-full shadow-sm">
                          <Play className="w-3.5 h-3.5 fill-white" />
                          Watch Now
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => triggerFileDownload(buildApiUrl(video.filepath), video.filename || `${video.videotitle}.mp4`)}
                        className="border-gray-300 hover:bg-gray-100 text-gray-700 font-medium flex items-center gap-1.5 rounded-full"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download File
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
