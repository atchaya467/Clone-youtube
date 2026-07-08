"use client";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { buildApiUrl } from "@/lib/api";
import { Trash2 } from "lucide-react";

export default function VideoCard({ video, onDelete }: any) {
  return (
    <Link href={`/watch/${video?._id}`} className="group">
      <div className="space-y-3">
        <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
          <video
            src={buildApiUrl(video?.filepath)}
            className="object-cover group-hover:scale-105 transition-transform duration-200"
          />
          <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1 rounded">
            10:24
          </div>
        </div>
        <div className="flex gap-3 relative">
          <Avatar className="w-9 h-9 flex-shrink-0">
            <AvatarFallback>{video?.videochanel?.[0] || "V"}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600">
              {video?.videotitle}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{video?.videochanel}</p>
            <p className="text-sm text-gray-600">
              {video?.views?.toLocaleString() || 0} views •{" "}
              {video?.createdAt ? formatDistanceToNow(new Date(video.createdAt)) : "some time"} ago
            </p>
          </div>
          {onDelete && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete(video._id);
              }}
              className="absolute right-0 bottom-0 p-1.5 bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-455 rounded-lg transition-colors border border-rose-200 dark:border-rose-900/60"
              title="Delete Video"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}
