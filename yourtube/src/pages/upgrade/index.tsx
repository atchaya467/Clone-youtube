"use client";

import { useUser } from "@/lib/AuthContext";
import { Check, ShieldCheck, Sparkles, Zap, Award, Loader2, CreditCard, Lock, CheckCircle2, ArrowRight, AlertCircle } from "lucide-react";
import React, { useState } from "react";
import axiosInstance from "@/lib/axiosinstance";
import { toast } from "sonner";

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
      "5 minutes watch limit per video",
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

type PaymentStep = "idle" | "checkout" | "processing" | "success" | "error";

export default function UpgradePage() {
  const { user, login } = useUser();
  const currentPlan = user?.plan || "Free";

  const [paymentStep, setPaymentStep] = useState<PaymentStep>("idle");
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [processingStatus, setProcessingStatus] = useState("");

  const handleSelectPlan = (plan: any) => {
    if (!user) {
      toast.error("Please sign in to upgrade your plan.");
      return;
    }
    if (plan.name === "Free") {
      toast.error("You are on the Free plan by default.");
      return;
    }
    setSelectedPlan(plan);
    setCardNumber("");
    setCardName(user.name || "");
    setCardExpiry("");
    setCardCvv("");
    setPaymentStep("checkout");
  };

  const handleTriggerMockPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setPaymentStep("processing");
    
    // Simulating Realistic Payment Gateway Processing Steps
    try {
      setProcessingStatus("Connecting to Razorpay Secure API...");
      await new Promise((resolve) => setTimeout(resolve, 800));

      setProcessingStatus("Verifying card credentials & 3D secure authentication...");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setProcessingStatus("Authorizing transaction with issuing bank...");
      await new Promise((resolve) => setTimeout(resolve, 800));

      setProcessingStatus("Settling payment & generating tax invoice...");
      
      // Perform actual payment verification request to backend to execute plan change
      const verifyRes = await axiosInstance.post("/payment/verify", {
        razorpay_payment_id: `pay_mock_${Date.now()}`,
        razorpay_order_id: `order_mock_${Date.now()}`,
        razorpay_signature: "mock_signature",
        userId: user._id,
        plan: selectedPlan.name,
        amount: selectedPlan.price,
      });

      if (verifyRes.data.success) {
        // Update user state globally
        login(verifyRes.data.user);
        setPaymentStep("success");
      } else {
        setPaymentStep("error");
      }
    } catch (err) {
      console.error(err);
      setPaymentStep("error");
    }
  };

  const closePaymentModal = () => {
    setPaymentStep("idle");
    setSelectedPlan(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 animate-in fade-in slide-in-from-top-4 duration-300">
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
                    : "border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 hover:-translate-y-1 shadow-sm hover:shadow-md"
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
                    <span className="text-slate-550 dark:text-slate-450 ml-2">/ one-time</span>
                  </div>

                  <ul className="space-y-4 text-sm text-slate-650 dark:text-slate-300">
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
                    onClick={() => handleSelectPlan(plan)}
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

      {/* GORGEOUS CUSTOM REALISTIC PAYMENT MODAL */}
      {paymentStep !== "idle" && selectedPlan && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="bg-orange-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <span className="font-bold text-sm tracking-wide uppercase">Razorpay Secure Checkout</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs bg-orange-700/60 px-2 py-0.5 rounded border border-orange-500/35">
                <Lock className="w-3.5 h-3.5" />
                <span>Test Mode</span>
              </div>
            </div>

            <div className="p-6">
              
              {/* STEP 1: CHECKOUT INFO & CARD DETAILS */}
              {paymentStep === "checkout" && (
                <form onSubmit={handleTriggerMockPayment} className="space-y-4">
                  <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-between items-center mb-4">
                    <div>
                      <p className="text-xs text-slate-450 uppercase tracking-wider font-semibold">Plan Selected</p>
                      <h4 className="text-lg font-extrabold text-slate-900 dark:text-white">{selectedPlan.name} Plan</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-450 uppercase tracking-wider font-semibold">Amount Due</p>
                      <h4 className="text-2xl font-black text-orange-600 dark:text-orange-400">₹{selectedPlan.price}</h4>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1">Card Number</label>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="4111 2222 3333 4444"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "");
                            let formatted = val.match(/.{1,4}/g)?.join(" ") || val;
                            setCardNumber(formatted);
                          }}
                          className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold tracking-wider"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-450 italic">VISA</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        required
                        placeholder="John Doe"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1">Expiry Date</label>
                        <input
                          type="text"
                          required
                          placeholder="MM/YY"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "");
                            if (val.length > 2) {
                              val = val.substring(0, 2) + "/" + val.substring(2);
                            }
                            setCardExpiry(val);
                          }}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold tracking-wider text-center"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-450 uppercase tracking-wider mb-1">CVV</label>
                        <input
                          type="password"
                          required
                          placeholder="•••"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ""))}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-semibold tracking-widest text-center"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-slate-100 dark:border-slate-850">
                    <button
                      type="button"
                      onClick={closePaymentModal}
                      className="flex-1 py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
                    >
                      <span>Pay ₹{selectedPlan.price}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {/* STEP 2: PROCESSING ANIMATION */}
              {paymentStep === "processing" && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-orange-600 animate-spin" />
                    <CreditCard className="w-6 h-6 text-orange-600 absolute inset-0 m-auto" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Transaction in Progress</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium animate-pulse">
                      {processingStatus}
                    </p>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-orange-600 h-full w-2/3 rounded-full animate-infinite-loading" />
                  </div>
                </div>
              )}

              {/* STEP 3: SUCCESS ANIMATION & TRANSITION DETAILS */}
              {paymentStep === "success" && (
                <div className="py-6 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-300">
                  <div className="relative">
                    <div className="absolute inset-0 bg-emerald-500/10 rounded-full w-20 h-20 -m-2 animate-ping" />
                    <CheckCircle2 className="w-16 h-16 text-emerald-500 relative z-10" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-2xl font-black text-slate-900 dark:text-white">Upgrade Successful!</h4>
                    <p className="text-sm text-emerald-600 dark:text-emerald-400 font-semibold">Payment Verified & Settled</p>
                  </div>

                  {/* Plan Transition Box */}
                  <div className="bg-slate-550 dark:bg-slate-950 p-4 rounded-xl border border-slate-200 dark:border-slate-850 w-full flex items-center justify-center gap-6">
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-450 uppercase font-bold tracking-wider">Old Plan</span>
                      <span className="text-sm font-semibold text-slate-400 line-through">{currentPlan}</span>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center text-orange-600">
                      <ArrowRight className="w-4 h-4" />
                    </div>
                    <div className="text-center">
                      <span className="block text-[10px] text-slate-450 uppercase font-bold tracking-wider">New Plan</span>
                      <span className="text-base font-extrabold text-orange-600 dark:text-orange-400 animate-pulse">{selectedPlan.name}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs">
                    Your upgraded viewing limits and offline downloads are now active. A copy of your PDF invoice has been sent to your registered email address.
                  </p>

                  <button
                    onClick={closePaymentModal}
                    className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white font-bold text-sm shadow-md transition-all"
                  >
                    Start Watching
                  </button>
                </div>
              )}

              {/* STEP 4: ERROR */}
              {paymentStep === "error" && (
                <div className="py-8 flex flex-col items-center justify-center text-center space-y-6">
                  <div className="w-16 h-16 bg-rose-500/10 text-rose-500 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-rose-550" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-lg font-bold text-slate-900 dark:text-white">Payment Failed</h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      We couldn't verify your secure card credentials. Please try again.
                    </p>
                  </div>
                  <button
                    onClick={() => setPaymentStep("checkout")}
                    className="w-full py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm shadow-md transition-all"
                  >
                    Try Again
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
