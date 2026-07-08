"use client";

import { useUser } from "@/lib/AuthContext";
import { useRazorpayUpgrade } from "@/lib/useRazorpay";
import { Check, ShieldCheck, Sparkles, Zap, Award } from "lucide-react";
import React from "react";

const PLANS = [
  {
    name: "Free",
    price: 0,
    limitText: "5 minutes viewing limit",
    icon: Zap,
    color: "from-blue-500 to-indigo-500",
    shadowColor: "shadow-blue-100",
    features: [
      "Standard quality video streaming",
      "5 minutes daily watch limit per video",
      "Ad-supported viewing",
    ],
  },
  {
    name: "Bronze",
    price: 10,
    limitText: "7 minutes viewing limit",
    icon: Award,
    color: "from-amber-500 to-orange-600",
    shadowColor: "shadow-amber-100",
    features: [
      "HD quality video streaming",
      "7 minutes watch limit per video",
      "No ads",
      "Bronze badge next to comments",
    ],
  },
  {
    name: "Silver",
    price: 50,
    limitText: "10 minutes viewing limit",
    icon: ShieldCheck,
    color: "from-slate-400 to-slate-600",
    shadowColor: "shadow-slate-200",
    features: [
      "Full HD quality video streaming",
      "10 minutes watch limit per video",
      "Priority video downloads allowed",
      "No ads",
      "Silver badge next to comments",
    ],
  },
  {
    name: "Gold",
    price: 100,
    limitText: "Unlimited viewing",
    icon: Sparkles,
    color: "from-yellow-400 via-amber-500 to-orange-500",
    shadowColor: "shadow-yellow-100",
    features: [
      "4K Ultra HD quality streaming",
      "Unlimited watch time",
      "Unlimited video downloads",
      "No ads",
      "Gold badge & Premium priority support",
    ],
  },
];

export default function UpgradePage() {
  const { user, upgradeUserLocally } = useUser();
  const { triggerUpgrade } = useRazorpayUpgrade(user, upgradeUserLocally);

  const currentPlan = user?.plan || "Free";

  const handleSelectPlan = (planName: string, price: number) => {
    if (planName === "Free") {
      alert("You are on the Free plan by default.");
      return;
    }
    triggerUpgrade(planName, price);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-5xl">
            Upgrade Your Viewing Plan
          </h1>
          <p className="mt-4 text-xl text-slate-500 dark:text-slate-400">
            Choose a plan that fits your watching schedule. Get more time, better quality, and premium features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const isCurrent = currentPlan.toLowerCase() === plan.name.toLowerCase();
            
            return (
              <div
                key={plan.name}
                className={`bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border transition-all duration-300 relative flex flex-col justify-between ${
                  isCurrent
                    ? "border-orange-500 ring-2 ring-orange-500/20 scale-[1.03]"
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:-translate-y-1 shadow-sm hover:shadow-md"
                }`}
              >
                {isCurrent && (
                  <div className="absolute top-0 right-0 left-0 bg-orange-500 text-white text-center text-xs font-semibold py-1.5 uppercase tracking-wider">
                    Current Active Plan
                  </div>
                )}
                
                <div className="p-8 pt-10">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white mb-6 shadow-lg ${plan.shadowColor}`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{plan.name}</h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mb-6">{plan.limitText}</p>

                  <div className="flex items-baseline mb-8">
                    <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹{plan.price}</span>
                    <span className="text-slate-500 dark:text-slate-450 ml-2">/ one-time</span>
                  </div>

                  <ul className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="w-5 h-5 text-emerald-500 shrink-0 mr-3 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-8 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-850">
                  <button
                    onClick={() => handleSelectPlan(plan.name, plan.price)}
                    disabled={isCurrent || plan.name === "Free"}
                    className={`w-full py-3 px-4 rounded-xl text-center text-sm font-semibold transition-all duration-200 ${
                      isCurrent
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-default"
                        : plan.name === "Free"
                        ? "bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 cursor-default"
                        : "bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-sm hover:shadow-md"
                    }`}
                  >
                    {isCurrent ? "Active" : plan.name === "Free" ? "Default" : `Upgrade to ${plan.name}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
