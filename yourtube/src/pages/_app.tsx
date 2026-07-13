import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import { Toaster } from "@/components/ui/sonner";
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { UserProvider } from "../lib/AuthContext";
import { useEffect, useState } from "react";
import axiosInstance from "@/lib/axiosinstance";

export default function App({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const applyLocationTheme = async () => {
      try {
        let overrideState = "";
        let forceTheme = "";
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          overrideState = params.get("overrideState") || "";
          forceTheme = params.get("theme") || "";
        }

        if (forceTheme === "light") {
          setTheme("light");
          document.documentElement.classList.remove("dark");
          return;
        } else if (forceTheme === "dark") {
          setTheme("dark");
          document.documentElement.classList.add("dark");
          return;
        }

        const res = await axiosInstance.get(`/location${overrideState ? `?overrideState=${overrideState}` : ""}`);
        const stateName = res.data?.state || "Tamil Nadu";

        const checkLightTheme = () => {
          const southIndiaStates = [
            "tamil nadu",
            "kerala",
            "karnataka",
            "andhra pradesh",
            "telangana"
          ];
          const isSouthIndia = southIndiaStates.includes(stateName.toLowerCase());

          // Robust, cross-browser timezone-independent IST Time Check
          const now = new Date();
          const utc = now.getTime() + now.getTimezoneOffset() * 60000;
          const istOffset = 5.5 * 3600000; // IST is UTC + 5:30
          const istTime = new Date(utc + istOffset);
          const hour = istTime.getHours();
          const minute = istTime.getMinutes();

          const totalMinutes = hour * 60 + minute;
          const start = 10 * 60; // 10:00 AM
          const end = 12 * 60;   // 12:00 PM
          const isBetweenTime = totalMinutes >= start && totalMinutes <= end;

          return isSouthIndia && isBetweenTime;
        };

        if (checkLightTheme()) {
          setTheme("light");
          document.documentElement.classList.remove("dark");
        } else {
          setTheme("dark");
          document.documentElement.classList.add("dark");
        }
      } catch (err) {
        console.error("Theme calculation failed, defaulting to dark theme:", err);
        setTheme("dark");
        document.documentElement.classList.add("dark");
      }
    };

    applyLocationTheme();
  }, []);

  return (
    <UserProvider>
      <div className="min-h-screen bg-white dark:bg-slate-955 text-slate-900 dark:text-slate-100 transition-colors duration-200 flex flex-col w-full">
        <title>Your-Tube Clone</title>
        <Header />
        <Toaster />
        <div className="flex flex-1 w-full">
          <Sidebar />
          <main className="flex-grow flex-1 min-w-0 w-full">
            <Component {...pageProps} />
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
