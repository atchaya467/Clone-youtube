"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import { PlaySquare, LogIn, Compass, ArrowRight, User } from "lucide-react";
import { useUser } from "@/lib/AuthContext";
import axiosInstance from "@/lib/axiosinstance";
import VideoCard from "@/components/videocard";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const MOCK_CHANNELS = [
  { id: "ch1", name: "Nature Channel", count: "1.2M subscribers", fallback: "NC", bg: "bg-emerald-600" },
  { id: "ch2", name: "Chef's Kitchen", count: "850K subscribers", fallback: "CK", bg: "bg-amber-600" },
  { id: "ch3", name: "Chill Vibes", count: "3.4M subscribers", fallback: "CV", bg: "bg-indigo-600" },
  { id: "ch4", name: "Gaming Hub", count: "5.1M subscribers", fallback: "GH", bg: "bg-teal-600" },
  { id: "ch5", name: "Global News 24", count: "10M subscribers", fallback: "GN", bg: "bg-cyan-600" },
  { id: "ch6", name: "Sports Central", count: "2.3M subscribers", fallback: "SC", bg: "bg-yellow-600" },
  { id: "ch7", name: "CineTrailers", count: "15M subscribers", fallback: "CT", bg: "bg-pink-600" },
];

const MOCK_VIDEOS = [
  {
    _id: "66851f5c6e84d412e8790001",
    videotitle: "Amazing Nature Documentary: Secrets of the Deep Forest",
    filename: "nature-doc.mp4",
    filetype: "video/mp4",
    filepath: "/video/vdo.mp4",
    filesize: "500MB",
    videochanel: "Nature Channel",
    Like: 1250,
    views: 145000,
    uploader: "nature_lover",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    _id: "66851f5c6e84d412e8790002",
    videotitle: "Cooking Tutorial: Perfect Italian Pasta Carbonara Masterclass",
    filename: "pasta-tutorial.mp4",
    filetype: "video/mp4",
    filepath: "/video/vdo.mp4",
    filesize: "300MB",
    videochanel: "Chef's Kitchen",
    Like: 9890,
    views: 523000,
    uploader: "chef_master",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    _id: "66851f5c6e84d412e8790003",
    videotitle: "Lo-Fi Beats for Coding, Studying and Deep Focus",
    filename: "lofi-music.mp4",
    filetype: "video/mp4",
    filepath: "/video/vdo.mp4",
    filesize: "400MB",
    videochanel: "Chill Vibes",
    Like: 15400,
    views: 890000,
    uploader: "lofi_beats",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    _id: "66851f5c6e84d412e8790004",
    videotitle: "Minecraft Speedrun but Every Block Explodes! [World Record Attempt]",
    filename: "minecraft.mp4",
    filetype: "video/mp4",
    filepath: "/video/vdo.mp4",
    filesize: "450MB",
    videochanel: "Gaming Hub",
    Like: 23100,
    views: 1245000,
    uploader: "speedrunner_pro",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    _id: "66851f5c6e84d412e8790005",
    videotitle: "Breaking World News: Live Updates and Analysis on Global Summit",
    filename: "news-report.mp4",
    filetype: "video/mp4",
    filepath: "/video/vdo.mp4",
    filesize: "150MB",
    videochanel: "Global News 24",
    Like: 3450,
    views: 95000,
    uploader: "news_reporter",
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
  {
    _id: "66851f5c6e84d412e8790006",
    videotitle: "Soccer World Cup 2026: Top 10 Best Goals & Matches Highlights",
    filename: "sports-highlights.mp4",
    filetype: "video/mp4",
    filepath: "/video/vdo.mp4",
    filesize: "320MB",
    videochanel: "Sports Central",
    Like: 45600,
    views: 2340000,
    uploader: "sports_fanatic",
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    _id: "66851f5c6e84d412e8790007",
    videotitle: "Official Sci-Fi Blockbuster Movie Trailer 2026: The New Horizon",
    filename: "movie-trailer.mp4",
    filetype: "video/mp4",
    filepath: "/video/vdo.mp4",
    filesize: "200MB",
    videochanel: "CineTrailers",
    Like: 87500,
    views: 4500000,
    uploader: "movie_studio",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  }
];

export default function SubscriptionsPage() {
  const { user, handlegooglesignin } = useUser();
  const [videos, setVideos] = useState<any[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchVideos = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        if (Array.isArray(res.data) && res.data.length > 0) {
          setVideos(res.data);
        } else {
          setVideos(MOCK_VIDEOS);
        }
      } catch (error) {
        console.warn("Could not fetch videos from server, using offline mock data.", error);
        setVideos(MOCK_VIDEOS);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, [user]);

  useEffect(() => {
    if (selectedChannel) {
      const matched = videos.filter(
        v => (v.videochanel || "").toLowerCase() === selectedChannel.toLowerCase()
      );
      setFilteredVideos(matched);
    } else {
      setFilteredVideos(videos);
    }
  }, [videos, selectedChannel]);

  if (!user) {
    return (
      <>
        <Head>
          <title>Subscriptions - Your-Tube Clone</title>
        </Head>
        <main className="flex-1 min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-6 text-center space-y-6 text-slate-900 dark:text-slate-100">
          <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-400 dark:text-slate-600">
            <PlaySquare className="w-10 h-10" />
          </div>
          <div className="space-y-2 max-w-sm">
            <h1 className="text-2xl font-black tracking-tight">Don't miss new videos</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Sign in to see updates from your favorite YouTube channels here
            </p>
          </div>
          <Button 
            onClick={handlegooglesignin}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full flex items-center gap-2 shadow"
          >
            <User className="w-4 h-4" />
            <span>Sign In</span>
          </Button>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Subscriptions - Your-Tube Clone</title>
      </Head>

      <main className="flex-1 p-6 max-w-7xl mx-auto space-y-8 w-full text-slate-900 dark:text-slate-100 transition-colors duration-200">
        
        {/* SUBSCRIBED CHANNELS ROW */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-550">
              Subscribed Channels
            </h2>
            {selectedChannel && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSelectedChannel(null)}
                className="text-xs text-blue-600 dark:text-blue-400 font-semibold"
              >
                Show All
              </Button>
            )}
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            <button
              onClick={() => setSelectedChannel(null)}
              className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
            >
              <div className={`
                w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all duration-200
                ${!selectedChannel 
                  ? "border-blue-600 bg-blue-600 text-white shadow-md scale-105" 
                  : "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 group-hover:border-slate-400"
                }
              `}>
                <PlaySquare className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold">All</span>
            </button>

            {MOCK_CHANNELS.map((channel) => {
              const isSelected = selectedChannel?.toLowerCase() === channel.name.toLowerCase();
              return (
                <button
                  key={channel.id}
                  onClick={() => setSelectedChannel(channel.name)}
                  className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group"
                >
                  <div className={`
                    w-14 h-14 rounded-full flex items-center justify-center text-white text-sm font-black transition-all duration-200 shadow border-2
                    ${channel.bg}
                    ${isSelected 
                      ? "border-blue-600 ring-2 ring-blue-600/30 scale-105" 
                      : "border-transparent group-hover:scale-105"
                    }
                  `}>
                    <Avatar className="w-full h-full">
                      <AvatarFallback className="bg-transparent text-white font-black text-sm">
                        {channel.fallback}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <div className="text-center space-y-0.5">
                    <p className={`text-[10px] font-bold line-clamp-1 ${isSelected ? "text-blue-600 dark:text-blue-450" : ""}`}>
                      {channel.name}
                    </p>
                    <p className="text-[8px] text-slate-450">{channel.count}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* VIDEOS LISTING SECTION */}
        <section className="space-y-6 pt-2">
          <div className="flex items-center justify-between border-b dark:border-slate-850 pb-4">
            <h2 className="text-lg font-bold tracking-tight">
              {selectedChannel ? `Latest from ${selectedChannel}` : "Latest Uploads"}
            </h2>
            <span className="text-xs font-semibold text-slate-450">
              {filteredVideos.length} {filteredVideos.length === 1 ? "video" : "videos"} found
            </span>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="aspect-video rounded-xl bg-slate-200 dark:bg-slate-850" />
                  <div className="h-4 bg-slate-200 dark:bg-slate-850 rounded w-3/4" />
                  <div className="h-3 bg-slate-200 dark:bg-slate-850 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
              <PlaySquare className="w-12 h-12 text-slate-350 dark:text-slate-700" />
              <div className="space-y-1">
                <p className="font-bold text-sm">No videos found</p>
                <p className="text-xs text-slate-500 max-w-xs">
                  This channel hasn't uploaded any videos yet.
                </p>
              </div>
              <Button onClick={() => setSelectedChannel(null)} size="sm" variant="outline">
                Show All Subscriptions
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredVideos.map((video) => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
