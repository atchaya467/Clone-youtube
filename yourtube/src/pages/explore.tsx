"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import { Flame, Music, Gamepad2, Newspaper, Trophy, Film, Compass, Info } from "lucide-react";
import axiosInstance from "@/lib/axiosinstance";
import VideoCard from "@/components/videocard";
import { Button } from "@/components/ui/button";

const MOCK_EXPLORE_VIDEOS = [
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

interface ExploreCategory {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  gradient: string;
  keywords: string[];
}

const EXPLORE_CATEGORIES: ExploreCategory[] = [
  {
    id: "trending",
    name: "Trending",
    icon: Flame,
    gradient: "from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700",
    keywords: []
  },
  {
    id: "music",
    name: "Music",
    icon: Music,
    gradient: "from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700",
    keywords: ["music", "song", "audio", "sound", "track", "concert", "live", "cover", "album", "beats", "lo-fi", "chill"]
  },
  {
    id: "gaming",
    name: "Gaming",
    icon: Gamepad2,
    gradient: "from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700",
    keywords: ["game", "gaming", "play", "walkthrough", "stream", "speedrun", "xbox", "ps5", "nintendo", "minecraft", "fortnite", "gamer"]
  },
  {
    id: "movies",
    name: "Movies & Shows",
    icon: Film,
    gradient: "from-pink-500 to-rose-600 dark:from-pink-600 dark:to-rose-700",
    keywords: ["movie", "film", "cinema", "trailer", "teaser", "show", "series", "episode", "blockbuster"]
  },
  {
    id: "news",
    name: "News",
    icon: Newspaper,
    gradient: "from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700",
    keywords: ["news", "today", "update", "breaking", "world", "local", "weather", "report", "summit", "politics"]
  },
  {
    id: "sports",
    name: "Sports",
    icon: Trophy,
    gradient: "from-amber-500 to-yellow-600 dark:from-amber-600 dark:to-yellow-700",
    keywords: ["sports", "football", "soccer", "basketball", "cricket", "match", "highlights", "goal", "athlete", "cup", "tournament"]
  }
];

export default function ExplorePage() {
  const [allVideos, setAllVideos] = useState<any[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("trending");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axiosInstance.get("/video/getall");
        if (Array.isArray(res.data) && res.data.length > 0) {
          setAllVideos(res.data);
        } else {
          setAllVideos(MOCK_EXPLORE_VIDEOS);
        }
      } catch (error: any) {
        console.warn("Could not fetch videos from backend, using high-quality offline fallbacks.", error);
        setAllVideos(MOCK_EXPLORE_VIDEOS);
        setErrorMsg("Running in offline mode - displaying featured explore content");
      } finally {
        setLoading(false);
      }
    };
    fetchVideos();
  }, []);

  useEffect(() => {
    if (allVideos.length === 0) return;

    const currentCat = EXPLORE_CATEGORIES.find(c => c.id === activeCategory);
    if (!currentCat || activeCategory === "trending") {
      // Sort trending videos by views descending
      const sorted = [...allVideos].sort((a, b) => (b.views || 0) - (a.views || 0));
      setFilteredVideos(sorted);
    } else {
      // Filter videos by keywords in their title or uploader/channel name
      const keywords = currentCat.keywords;
      const matched = allVideos.filter(video => {
        const title = (video.videotitle || "").toLowerCase();
        const channel = (video.videochanel || "").toLowerCase();
        return keywords.some(kw => title.includes(kw) || channel.includes(kw));
      });

      // Sort matching videos by views descending
      const sorted = matched.sort((a, b) => (b.views || 0) - (a.views || 0));
      setFilteredVideos(sorted);
    }
  }, [allVideos, activeCategory]);

  return (
    <>
      <Head>
        <title>Explore - Your-Tube Clone</title>
        <meta name="description" content="Discover trending music, gaming, news, and movies on Your-Tube." />
      </Head>

      <main className="flex-1 p-6 max-w-7xl mx-auto space-y-8 w-full text-slate-900 dark:text-slate-100 transition-colors duration-200">
        
        {/* HERO HEADER BANNER */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 dark:from-red-950/40 dark:via-orange-950/40 dark:to-amber-950/40 p-8 md:p-12 shadow-2xl border border-orange-500/10 dark:border-orange-500/5">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-2xl -ml-16 -mb-16 pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur text-white shadow-sm">
                <Compass className="w-3.5 h-3.5" />
                Discover
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight drop-shadow-sm">
                Explore Content
              </h1>
              <p className="text-sm md:text-base text-white/95 leading-relaxed drop-shadow-sm font-medium">
                Keep up with the most popular videos, music hits, esports, movie trailers, and breaking updates worldwide.
              </p>
            </div>
            <div className="hidden lg:flex items-center justify-center w-36 h-36 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-inner transform rotate-3">
              <Compass className="w-16 h-16 text-white animate-pulse" />
            </div>
          </div>
        </div>

        {/* OFFLINE STATUS NOTIFICATION */}
        {errorMsg && (
          <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 dark:text-amber-450 p-4 rounded-2xl text-xs font-medium">
            <Info className="w-5 h-5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* CATEGORY GRID NAVIGATION */}
        <section className="space-y-3">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-slate-550">
            Browse Categories
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {EXPLORE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`
                    group relative rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2 border transition-all duration-200 overflow-hidden cursor-pointer
                    ${isActive 
                      ? "bg-slate-900 border-slate-800 text-white dark:bg-white dark:border-white dark:text-slate-950 shadow-md font-bold" 
                      : "bg-white hover:bg-slate-50 border-slate-100 text-slate-800 dark:bg-slate-900/50 dark:border-slate-850 dark:text-slate-200 dark:hover:bg-slate-850/50"
                    }
                  `}
                >
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br ${cat.gradient} shadow-md
                    group-hover:scale-110 transition-transform duration-200
                  `}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-bold leading-tight">{cat.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* DYNAMIC CONTENT TITLE */}
        <section className="space-y-6 pt-4">
          <div className="flex items-center justify-between border-b dark:border-slate-850 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 bg-orange-600 rounded-full" />
              <h2 className="text-xl font-bold tracking-tight">
                {EXPLORE_CATEGORIES.find(c => c.id === activeCategory)?.name || "Explore"}
              </h2>
            </div>
            <span className="text-xs font-semibold text-slate-450">
              {filteredVideos.length} {filteredVideos.length === 1 ? "video" : "videos"} found
            </span>
          </div>

          {/* VIDEOS GRID */}
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
              <Compass className="w-12 h-12 text-slate-350 dark:text-slate-700 animate-spin duration-3000" />
              <div className="space-y-1">
                <p className="font-bold text-sm">No videos found</p>
                <p className="text-xs text-slate-500 max-w-xs">
                  We couldn't find any videos matching the keywords in the "{EXPLORE_CATEGORIES.find(c => c.id === activeCategory)?.name}" category.
                </p>
              </div>
              <Button onClick={() => setActiveCategory("trending")} size="sm" variant="outline">
                Back to Trending
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
