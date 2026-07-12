import {
  Home,
  Compass,
  PlaySquare,
  Clock,
  ThumbsUp,
  History,
  User,
  Download,
  Crown,
  Video,
} from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { Button } from "./ui/button";
import Channeldialogue from "./channeldialogue";
import { useUser } from "@/lib/AuthContext";
import { useRazorpayUpgrade } from "@/lib/useRazorpay";

const Sidebar = () => {
  const { user, upgradeUserLocally } = useUser();
  const { triggerUpgrade } = useRazorpayUpgrade(user, upgradeUserLocally);

  const [isdialogeopen, setisdialogeopen] = useState(false);
  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-850 min-h-screen p-2 flex flex-col justify-between dark:text-white transition-colors duration-200">
      <nav className="space-y-1 flex-1">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start">
            <Home className="w-5 h-5 mr-3" />
            Home
          </Button>
        </Link>
        <Link href="/explore">
          <Button variant="ghost" className="w-full justify-start">
            <Compass className="w-5 h-5 mr-3" />
            Explore
          </Button>
        </Link>
        <Link href="/subscriptions">
          <Button variant="ghost" className="w-full justify-start">
            <PlaySquare className="w-5 h-5 mr-3" />
            Subscriptions
          </Button>
        </Link>

        {user && (
          <>
            <div className="border-t pt-2 mt-2">
              <Link href="/history">
                <Button variant="ghost" className="w-full justify-start">
                  <History className="w-5 h-5 mr-3" />
                  History
                </Button>
              </Link>
              <Link href="/liked">
                <Button variant="ghost" className="w-full justify-start">
                  <ThumbsUp className="w-5 h-5 mr-3" />
                  Liked videos
                </Button>
              </Link>
              <Link href="/watch-later">
                <Button variant="ghost" className="w-full justify-start">
                  <Clock className="w-5 h-5 mr-3" />
                  Watch later
                </Button>
              </Link>
              <Link href="/downloads">
                <Button variant="ghost" className="w-full justify-start">
                  <Download className="w-5 h-5 mr-3" />
                  Downloads
                </Button>
              </Link>
              <Link href="/call">
                <Button variant="ghost" className="w-full justify-start text-orange-600 dark:text-orange-400 font-semibold">
                  <Video className="w-5 h-5 mr-3" />
                  VoIP Call / Party
                </Button>
              </Link>
              {user?.channelname ? (
                <Link href={`/channel/${user._id || user.id}`}>
                  <Button variant="ghost" className="w-full justify-start">
                    <User className="w-5 h-5 mr-3" />
                    Your channel
                  </Button>
                </Link>
              ) : (
                <div className="px-2 py-1.5">
                  <Button
                    variant="secondary"
                    size="sm"
                    className="w-full"
                    onClick={() => setisdialogeopen(true)}
                  >
                    Create Channel
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      {user && !user.isPremium && (
        <div className="border-t pt-4 mt-4 px-2 pb-4">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg p-3 text-white shadow-md text-left">
            <h4 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Crown className="w-4 h-4 text-yellow-200 fill-yellow-200" />
              Go Premium
            </h4>
            <p className="text-[11px] mt-1 opacity-90 leading-tight">
              Unlock unlimited video downloads and support the platform!
            </p>
            <Button 
              onClick={triggerUpgrade}
              className="w-full mt-3 bg-white hover:bg-yellow-50 text-orange-600 font-bold text-xs py-1.5 rounded shadow"
            >
              Upgrade (₹199)
            </Button>
          </div>
        </div>
      )}

      <Channeldialogue
        isopen={isdialogeopen}
        onclose={() => setisdialogeopen(false)}
        mode="create"
      />
    </aside>
  );
};

export default Sidebar;
