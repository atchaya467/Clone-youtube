import ChannelHeader from "@/components/ChannelHeader";
import Channeltabs from "@/components/Channeltabs";
import ChannelVideos from "@/components/ChannelVideos";
import VideoUploader from "@/components/VideoUploader";
import { useUser } from "@/lib/AuthContext";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useUser();
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchChannelVideos = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await axiosInstance.get("/video/getall");
      // Filter videos by this channel uploader id
      const filtered = response.data.filter((v: any) => v.uploader === id);
      setVideos(filtered);
    } catch (err) {
      console.error("Error fetching channel videos:", err);
      toast.error("Failed to load channel videos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannelVideos();
  }, [id]);

  const handleDeleteVideo = async (videoId: string) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this video?");
    if (!confirmDelete) return;

    try {
      await axiosInstance.delete(`/video/delete/${videoId}`);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      toast.success("Video deleted successfully");
    } catch (err) {
      console.error("Error deleting video:", err);
      toast.error("Failed to delete video");
    }
  };

  const isOwner = user && user._id === id;

  const channel = isOwner
    ? user
    : {
        _id: id,
        channelname: videos[0]?.videochanel || "Channel",
        description: "Welcome to my channel!",
      };

  return (
    <div className="flex-1 min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-full mx-auto">
        <ChannelHeader channel={channel} user={user} videoCount={videos.length} />
        <Channeltabs />
        
        {isOwner && (
          <div className="px-4 pb-8">
            <VideoUploader channelId={id} channelName={channel?.channelname} onUploadSuccess={fetchChannelVideos} />
          </div>
        )}

        <div className="px-4 pb-8">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading videos...</p>
            </div>
          ) : (
            <ChannelVideos videos={videos} onDelete={isOwner ? handleDeleteVideo : undefined} />
          )}
        </div>
      </div>
    </div>
  );
};

export default index;
