import React, { useEffect, useState } from "react";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import {
  Clock,
  Download,
  MoreHorizontal,
  Share,
  ThumbsDown,
  ThumbsUp,
  Crown,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "./ui/dialog";
import { useRazorpayUpgrade } from "@/lib/useRazorpay";
import { buildApiUrl } from "@/lib/api";

const VideoInfo = ({ video }: any) => {
  const [likes, setlikes] = useState(video.Like || 0);
  const [dislikes, setDislikes] = useState(video.Dislike || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [isDisliked, setIsDisliked] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const { user, upgradeUserLocally } = useUser();
  const [isWatchLater, setIsWatchLater] = useState(false);
  const [isPremiumModalOpen, setIsPremiumModalOpen] = useState(false);

  const { triggerUpgrade } = useRazorpayUpgrade(user, upgradeUserLocally);

  const handleUpgradeClick = () => {
    setIsPremiumModalOpen(false);
    triggerUpgrade();
  };

  const handleDownload = async () => {
    console.log("handleDownload: started, user:", user, "video:", video);
    if (!user) {
      alert("Please sign in to download videos.");
      return;
    }

    try {
      console.log("handleDownload: checking eligibility...");
      const res = await axiosInstance.post("/download/check", {
        userId: user._id,
        videoId: video._id,
      });

      console.log("handleDownload: eligibility res:", res.data);
      if (res.data.allowed) {
        const downloadUrl = buildApiUrl(video.filepath);
        console.log("handleDownload: trigger download url:", downloadUrl);
        triggerFileDownload(downloadUrl, video.filename || `${video.videotitle}.mp4`);
      }
    } catch (error: any) {
      console.error("handleDownload: error encountered:", error);
      if (error.response && error.response.status === 403) {
        setIsPremiumModalOpen(true);
      } else {
        alert(error.response?.data?.message || "Error processing download.");
      }
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

  // const user: any = {
  //   id: "1",
  //   name: "John Doe",
  //   email: "john@example.com",
  //   image: "https://github.com/shadcn.png?height=32&width=32",
  // };
  useEffect(() => {
    setlikes(video.Like || 0);
    setDislikes(video.Dislike || 0);
    setIsLiked(false);
    setIsDisliked(false);
    setIsWatchLater(false);
  }, [video]);

  useEffect(() => {
    const checkWatchLaterAndLikeStatus = async () => {
      if (!user || !video?._id) return;
      try {
        const watchLaterRes = await axiosInstance.get(`/watch/${user._id}`);
        const savedInWatchLater = watchLaterRes.data.some(
          (item: any) => item.videoid && item.videoid._id === video._id
        );
        setIsWatchLater(savedInWatchLater);

        const likedRes = await axiosInstance.get(`/like/${user._id}`);
        const likedVideo = likedRes.data.some(
          (item: any) => item.videoid && item.videoid._id === video._id
        );
        setIsLiked(likedVideo);
      } catch (error) {
        console.error("Error checking watch/like status:", error);
      }
    };
    checkWatchLaterAndLikeStatus();
  }, [user, video?._id]);

  useEffect(() => {
    const handleviews = async () => {
      if (!video?._id) return;
      try {
        if (user) {
          await axiosInstance.post(`/history/${video._id}`, {
            userId: user?._id,
          });
        } else {
          await axiosInstance.post(`/history/views/${video._id}`);
        }
      } catch (error) {
        console.log("Error updating views:", error);
      }
    };
    handleviews();
  }, [user, video?._id]);
  const handleLike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.liked) {
        if (isLiked) {
          setlikes((prev: any) => prev - 1);
          setIsLiked(false);
        } else {
          setlikes((prev: any) => prev + 1);
          setIsLiked(true);
          if (isDisliked) {
            setDislikes((prev: any) => prev - 1);
            setIsDisliked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleWatchLater = async () => {
    try {
      const res = await axiosInstance.post(`/watch/${video._id}`, {
        userId: user?._id,
      });
      if (res.data.watchlater) {
        setIsWatchLater(!isWatchLater);
      } else {
        setIsWatchLater(false);
      }
    } catch (error) {
      console.log(error);
    }
  };
  const handleDislike = async () => {
    if (!user) return;
    try {
      const res = await axiosInstance.post(`/like/${video._id}`, {
        userId: user?._id,
      });
      if (!res.data.liked) {
        if (isDisliked) {
          setDislikes((prev: any) => prev - 1);
          setIsDisliked(false);
        } else {
          setDislikes((prev: any) => prev + 1);
          setIsDisliked(true);
          if (isLiked) {
            setlikes((prev: any) => prev - 1);
            setIsLiked(false);
          }
        }
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">{video.videotitle}</h1>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center justify-between md:justify-start w-full md:w-auto gap-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-10 h-10">
              <AvatarFallback>{video.videochanel[0]}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-medium text-slate-900 dark:text-white">{video.videochanel}</h3>
              <p className="text-sm text-gray-650 dark:text-gray-400">1.2M subscribers</p>
            </div>
          </div>
          <Button className="ml-4">Subscribe</Button>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-none w-full md:w-auto -mx-4 px-4 md:mx-0 md:px-0 flex-nowrap">
          <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-full shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className="rounded-l-full text-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shrink-0"
              onClick={handleLike}
            >
              <ThumbsUp
                className={`w-5 h-5 mr-2 ${
                  isLiked ? "fill-black text-black dark:fill-white dark:text-white" : ""
                }`}
              />
              {likes.toLocaleString()}
            </Button>
            <div className="w-px h-6 bg-gray-300 dark:bg-slate-700 shrink-0" />
            <Button
              variant="ghost"
              size="sm"
              className="rounded-r-full text-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 shrink-0"
              onClick={handleDislike}
            >
              <ThumbsDown
                className={`w-5 h-5 mr-2 ${
                  isDisliked ? "fill-black text-black dark:fill-white dark:text-white" : ""
                }`}
              />
              {dislikes.toLocaleString()}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className={`bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full shrink-0 ${
              isWatchLater ? "text-primary dark:text-orange-500" : ""
            }`}
            onClick={handleWatchLater}
          >
            <Clock className="w-5 h-5 mr-2" />
            {isWatchLater ? "Saved" : "Watch Later"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full shrink-0"
          >
            <Share className="w-5 h-5 mr-2" />
            Share
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full shrink-0"
            onClick={handleDownload}
          >
            <Download className="w-5 h-5 mr-2" />
            Download
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="bg-gray-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-full shrink-0"
          >
            <MoreHorizontal className="w-5 h-5" />
          </Button>
        </div>
      </div>
      <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4 text-slate-800 dark:text-slate-100 transition-colors duration-200">
        <div className="flex gap-4 text-sm font-medium mb-2 text-slate-900 dark:text-slate-200">
          <span>{video.views.toLocaleString()} views</span>
          <span>{formatDistanceToNow(new Date(video.createdAt))} ago</span>
        </div>
        <div className={`text-sm text-slate-700 dark:text-slate-300 ${showFullDescription ? "" : "line-clamp-3"}`}>
          <p>
            Sample video description. This would contain the actual video
            description from the database.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 p-0 h-auto font-medium text-slate-800 dark:text-slate-200 dark:hover:text-white"
          onClick={() => setShowFullDescription(!showFullDescription)}
        >
          {showFullDescription ? "Show less" : "Show more"}
        </Button>
      </div>

      <Dialog open={isPremiumModalOpen} onOpenChange={setIsPremiumModalOpen}>
        <DialogContent className="sm:max-w-md text-center bg-white">
          <DialogHeader className="flex flex-col items-center">
            <div className="bg-amber-100 p-3 rounded-full mb-2">
              <Crown className="w-8 h-8 text-amber-500 fill-amber-500" />
            </div>
            <DialogTitle className="text-xl font-bold">Go Premium</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              You have reached your daily download limit (1 download per day).
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-2">
              Upgrade to Premium for ₹199 to enjoy unlimited downloads and exclusive features!
            </p>
          </div>
          <DialogFooter className="flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPremiumModalOpen(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpgradeClick}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold"
            >
              Upgrade Now (₹199)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VideoInfo;
