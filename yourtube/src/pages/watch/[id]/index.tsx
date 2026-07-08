import Comments from "@/components/Comments";
import RelatedVideos from "@/components/RelatedVideos";
import VideoInfo from "@/components/VideoInfo";
import Videopplayer from "@/components/Videopplayer";
import axiosInstance from "@/lib/axiosinstance";
import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";

const MOCK_VIDEOS = [
  {
    _id: "66851f5c6e84d412e8790001",
    videotitle: "Amazing Nature Documentary",
    filename: "nature-doc.mp4",
    filetype: "video/mp4",
    filepath: "/video/vdo.mp4",
    filesize: "500MB",
    videochanel: "Nature Channel",
    Like: 1250,
    Dislike: 50,
    views: 45000,
    uploader: "nature_lover",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "66851f5c6e84d412e8790002",
    videotitle: "Cooking Tutorial: Perfect Pasta",
    filename: "pasta-tutorial.mp4",
    filetype: "video/mp4",
    filepath: "/video/vdo.mp4",
    filesize: "300MB",
    videochanel: "Chef's Kitchen",
    Like: 890,
    Dislike: 20,
    views: 23000,
    uploader: "chef_master",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const index = () => {
  const router = useRouter();
  const { id } = router.query;
  const [videos, setvideo] = useState<any>(null);
  const [video, setvide] = useState<any>(null);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    const fetchvideo = async () => {
      if (!id || typeof id !== "string") return;
      try {
        const res = await axiosInstance.get("/video/getall");
        const list = Array.isArray(res.data) && res.data.length > 0 ? res.data : MOCK_VIDEOS;
        const matchedVideo = list.filter((vid: any) => vid._id === id);
        setvideo(matchedVideo[0] || MOCK_VIDEOS[0]);
        setvide(list);
      } catch (error) {
        console.log(error);
        const list = MOCK_VIDEOS;
        const matchedVideo = list.filter((vid: any) => vid._id === id);
        setvideo(matchedVideo[0] || MOCK_VIDEOS[0]);
        setvide(list);
      } finally {
        setloading(false);
      }
    };
    fetchvideo();
  }, [id]);

  if (loading) {
    return <div>Loading..</div>;
  }

  if (!videos) {
    return <div>Video not found</div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Videopplayer video={videos} />
            <VideoInfo video={videos} />
            <Comments videoId={id} />
          </div>
          <div className="space-y-4">
            <RelatedVideos videos={video} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default index;
