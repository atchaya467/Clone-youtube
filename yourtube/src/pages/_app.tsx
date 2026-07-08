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
        if (typeof window !== "undefined") {
          const params = new URLSearchParams(window.location.search);
          overrideState = params.get("overrideState") || "";
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

          // IST Time Check
          const now = new Date();
          const options: Intl.DateTimeFormatOptions = { 
            timeZone: "Asia/Kolkata", 
            hour: "2-digit", 
            minute: "2-digit", 
            hour12: false 
          };
          const formatter = new Intl.DateTimeFormat("en-US", options);
          const parts = formatter.formatToParts(now);
          const hour = Number(parts.find(p => p.type === "hour")?.value);
          const minute = Number(parts.find(p => p.type === "minute")?.value);

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
      <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <title>Your-Tube Clone</title>
        <Header />
        <Toaster />
        <div className="flex">
          <Sidebar />
          <Component {...pageProps} />
        </div>
      </div>
    </UserProvider>
  );
}
