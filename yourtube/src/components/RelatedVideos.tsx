import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { buildApiUrl } from "@/lib/api";

interface RelatedVideosProps {
  videos: Array<{
    _id: string;
    videotitle: string;
    videochanel: string;
    views: number;
    createdAt: string;
    filepath?: string;
    thumbnailpath?: string;
  }>;
}

export default function RelatedVideos({ videos }: RelatedVideosProps) {
  return (
    <div className="space-y-2">
      {videos.map((video) => (
        <Link
          key={video._id}
          href={`/watch/${video._id}`}
          className="flex gap-2 group"
        >
          <div className="relative w-40 aspect-video bg-gray-100 rounded overflow-hidden flex-shrink-0">
            {video.thumbnailpath ? (
              <img
                src={buildApiUrl(video.thumbnailpath)}
                alt={video.videotitle}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg?height=90&width=160";
                }}
              />
            ) : (
              <video
                src={buildApiUrl(video.filepath || "/video/vdo.mp4")}
                className="object-cover group-hover:scale-105 transition-transform duration-200"
                onError={(e) => {
                  const target = e.target as HTMLVideoElement;
                  if (!target.src.includes("/video/vdo.mp4")) {
                    target.src = "/video/vdo.mp4";
                  }
                }}
              />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">
              {video.videotitle}
            </h3>
            <p className="text-xs text-gray-600 mt-1">{video.videochanel}</p>
            <p className="text-xs text-gray-600">
              {video.views.toLocaleString()} views •{" "}
              {formatDistanceToNow(new Date(video.createdAt))} ago
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
