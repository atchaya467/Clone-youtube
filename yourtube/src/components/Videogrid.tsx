import React, { useEffect, useState } from "react";
import Videocard from "./videocard";
import axiosInstance from "@/lib/axiosinstance";
import { API_BASE_URL } from "@/lib/api";

const MOCK_VIDEOS = [
  {
    _id: "66851f5c6e84d412e8790001",
    videotitle: "Amazing Nature Documentary",
    filename: "nature-doc.mp4",
    filetype: "video/mp4",
    filepath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    filesize: "500MB",
    videochanel: "Nature Channel",
    Like: 1250,
    views: 45000,
    uploader: "nature_lover",
    createdAt: new Date().toISOString(),
  },
  {
    _id: "66851f5c6e84d412e8790002",
    videotitle: "Cooking Tutorial: Perfect Pasta",
    filename: "pasta-tutorial.mp4",
    filetype: "video/mp4",
    filepath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    filesize: "300MB",
    videochanel: "Chef's Kitchen",
    Like: 890,
    views: 23000,
    uploader: "chef_master",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

const Videogrid = () => {
  const [videos, setvideo] = useState<any[]>([]);
  const [loading, setloading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocalhostFallback, setIsLocalhostFallback] = useState(false);

  useEffect(() => {
    // Check if running on production domain but calling localhost
    const isProd = typeof window !== "undefined" && !window.location.hostname.includes("localhost");
    const usingLocalhost = API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1");
    if (isProd && usingLocalhost) {
      setIsLocalhostFallback(true);
    }

    const fetchvideo = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        if (Array.isArray(res.data) && res.data.length > 0) {
          setvideo(res.data);
        } else {
          setvideo(MOCK_VIDEOS);
          if (res.data && res.data.message) {
            setErrorMsg(`Backend returned message: ${res.data.message}`);
          }
        }
      } catch (error: any) {
        console.log(error);
        setvideo(MOCK_VIDEOS);
        let msg = "Could not reach database/server.";
        if (error.code === "ECONNABORTED") {
          msg = "Connection timed out (backend is taking too long to spin up or is offline).";
        } else if (error.response) {
          msg = `Backend server error: Status ${error.response.status} (${error.response.data?.message || "Internal Error"})`;
        } else if (error.request) {
          msg = "Network connection failed. Make sure the backend URL is active and CORS is allowed.";
        }
        setErrorMsg(msg);
      } finally {
        setloading(false);
      }
    };
    fetchvideo();
  }, []);

  return (
    <div className="flex flex-col w-full gap-4">
      {isLocalhostFallback && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 mb-4 rounded-r-md shadow-sm text-left">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-amber-500 font-bold">⚠️ Configuration Warning:</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-800 font-semibold">
                Environment Variable `NEXT_PUBLIC_BACKEND_URL` is not configured on Vercel!
              </p>
              <p className="text-xs text-amber-700 mt-1">
                The frontend is attempting to connect to the default local address: <code className="bg-amber-100 px-1 rounded">{API_BASE_URL}</code>. 
                Please set the <code className="bg-amber-100 px-1 rounded">NEXT_PUBLIC_BACKEND_URL</code> environment variable in your Vercel Project Settings to your Render backend (e.g. <code className="bg-amber-100 px-1 rounded">https://clone-youtube-lrby.onrender.com</code>) and re-deploy your project.
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border-l-4 border-rose-500 p-4 mb-4 rounded-r-md shadow-sm text-left">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-rose-500 font-bold">❌ Connection Error:</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-rose-800 font-semibold">
                Failed to load live videos ({errorMsg})
              </p>
              <p className="text-xs text-rose-700 mt-1">
                Showing mock offline videos instead. If this is a 500 error from Render, ensure your **MongoDB Atlas IP Whitelist** has access allowed from anywhere (<code className="bg-rose-100 px-1 rounded">0.0.0.0/0</code>) and that <code className="bg-rose-100 px-1 rounded">DB_URL</code> is set correctly in your Render dashboard environment variables.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? (
          <div className="col-span-full py-8 text-center text-gray-500 font-medium animate-pulse">
            Loading videos...
          </div>
        ) : (
          videos.map((video: any) => <Videocard key={video._id} video={video} />)
        )}
      </div>
    </div>
  );
};

export default Videogrid;
