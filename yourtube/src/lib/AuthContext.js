import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";
import { useState, createContext, useEffect, useContext } from "react";
import { provider, auth } from "./firebase";
import axiosInstance from "./axiosinstance";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // OTP Verification Modal States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpSentTo, setOtpSentTo] = useState("");
  const [otpChannelDetail, setOtpChannelDetail] = useState("");
  const [tempUserId, setTempUserId] = useState("");
  const [requirePhoneReg, setRequirePhoneReg] = useState(false);
  
  const [otpCode, setOtpCode] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [debugOtp, setDebugOtp] = useState("");

  const login = (userdata) => {
    setUser(userdata);
    localStorage.setItem("user", JSON.stringify(userdata));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem("user");
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const handlegooglesignin = async () => {
    setErrorMsg("");
    let overrideState = "";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      overrideState = params.get("overrideState") || "";
    }

    try {
      const result = await signInWithPopup(auth, provider);
      const firebaseuser = result.user;

      const payload = {
        email: firebaseuser.email,
        name: firebaseuser.displayName,
        image: firebaseuser.photoURL || "https://github.com/shadcn.png",
        overrideState,
      };

      const response = await axiosInstance.post("/user/login", payload);
      const data = response.data;

      if (data.requireOtp) {
        setTempUserId(data.tempUserId);
        setOtpSentTo(data.otpSentTo);
        setOtpChannelDetail(data.otpSentTo === "email" ? data.email : data.phone);
        setRequirePhoneReg(false);
        setDebugOtp(data.debugOtp || "");
        setShowOtpModal(true);
      } else if (data.requirePhoneRegistration) {
        setTempUserId(data.tempUserId);
        setRequirePhoneReg(true);
        setDebugOtp("");
        setShowOtpModal(true);
      } else {
        login(data.result);
      }
    } catch (error) {
      console.warn("Firebase Auth popup failed or was blocked, falling back to mock login flow...", error);
      try {
        const payload = {
          email: "atchaya@example.com",
          name: "Atchaya",
          image: "https://github.com/shadcn.png",
          overrideState,
        };

        const response = await axiosInstance.post("/user/login", payload);
        const data = response.data;

        if (data.requireOtp) {
          setTempUserId(data.tempUserId);
          setOtpSentTo(data.otpSentTo);
          setOtpChannelDetail(data.otpSentTo === "email" ? data.email : data.phone);
          setRequirePhoneReg(false);
          setDebugOtp(data.debugOtp || "");
          setShowOtpModal(true);
        } else if (data.requirePhoneRegistration) {
          setTempUserId(data.tempUserId);
          setRequirePhoneReg(true);
          setDebugOtp("");
          setShowOtpModal(true);
        } else {
          login(data.result);
        }
      } catch (fallbackError) {
        console.error("Login fallback failed:", fallbackError);
        setErrorMsg("Sign In failed. Please check your backend connection.");
      }
    }
  };

  const handleDemoSignin = async () => {
    setErrorMsg("");
    let overrideState = "";
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      overrideState = params.get("overrideState") || "";
    }

    try {
      const payload = {
        email: "atchaya@example.com",
        name: "Atchaya",
        image: "https://github.com/shadcn.png",
        overrideState,
      };

      const response = await axiosInstance.post("/user/login", payload);
      const data = response.data;

      if (data.requireOtp) {
        setTempUserId(data.tempUserId);
        setOtpSentTo(data.otpSentTo);
        setOtpChannelDetail(data.otpSentTo === "email" ? data.email : data.phone);
        setRequirePhoneReg(false);
        setDebugOtp(data.debugOtp || "");
        setShowOtpModal(true);
      } else if (data.requirePhoneRegistration) {
        setTempUserId(data.tempUserId);
        setRequirePhoneReg(true);
        setDebugOtp("");
        setShowOtpModal(true);
      } else {
        login(data.result);
      }
    } catch (fallbackError) {
      console.error("Demo login failed:", fallbackError);
      setErrorMsg("Sign In failed. Please check your backend connection.");
    }
  };

  const handleRegisterPhone = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!phoneInput) {
      setErrorMsg("Please enter a valid mobile number.");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post("/user/register-phone", {
        userId: tempUserId,
        phone: phoneInput,
      });
      const data = response.data;
      if (data.requireOtp) {
        setOtpSentTo(data.otpSentTo);
        setOtpChannelDetail(data.phone);
        setRequirePhoneReg(false);
        setDebugOtp(data.debugOtp || "");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to register phone.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (!otpCode || otpCode.length !== 6) {
      setErrorMsg("Please enter the 6-digit OTP code.");
      return;
    }
    setLoading(true);
    try {
      const response = await axiosInstance.post("/user/verify-otp", {
        userId: tempUserId,
        code: otpCode,
      });
      const data = response.data;
      if (data.success) {
        login(data.result);
        setShowOtpModal(false);
        setOtpCode("");
        setPhoneInput("");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Invalid or expired verification code.");
    } finally {
      setLoading(false);
    }
  };

  const upgradeUserLocally = (updatedData) => {
    if (user) {
      const updatedUser = { ...user, isPremium: true, ...updatedData };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    }
  };

  useEffect(() => {
    const localUser = localStorage.getItem("user");
    if (localUser) {
      try {
        setUser(JSON.parse(localUser));
      } catch (err) {
        console.error("Error parsing stored user:", err);
      }
    }

    const unsubcribe = onAuthStateChanged(auth, async (firebaseuser) => {
      if (firebaseuser) {
        const localUser = localStorage.getItem("user");
        if (!localUser) {
          try {
            let overrideState = "";
            if (typeof window !== "undefined") {
              const params = new URLSearchParams(window.location.search);
              overrideState = params.get("overrideState") || "";
            }
            const payload = {
              email: firebaseuser.email,
              name: firebaseuser.displayName,
              image: firebaseuser.photoURL || "https://github.com/shadcn.png",
              overrideState,
            };
            const response = await axiosInstance.post("/user/login", payload);
            const data = response.data;
            if (data.requireOtp) {
              setTempUserId(data.tempUserId);
              setOtpSentTo(data.otpSentTo);
              setOtpChannelDetail(data.otpSentTo === "email" ? data.email : data.phone);
              setRequirePhoneReg(false);
              setDebugOtp(data.debugOtp || "");
              setShowOtpModal(true);
            } else if (data.requirePhoneRegistration) {
              setTempUserId(data.tempUserId);
              setRequirePhoneReg(true);
              setDebugOtp("");
              setShowOtpModal(true);
            } else {
              login(data.result);
            }
          } catch (error) {
            console.error(error);
            logout();
          }
        }
      }
    });
    return () => unsubcribe();
  }, []);

  return (
    <UserContext.Provider value={{ user, login, logout, handlegooglesignin, handleDemoSignin, upgradeUserLocally }}>
      {children}
      {showOtpModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-8 relative animate-in fade-in zoom-in-95 duration-200 text-left">
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
              {requirePhoneReg ? "Register Mobile Number" : "Enter Verification Code"}
            </h3>
            
            {requirePhoneReg ? (
              <form onSubmit={handleRegisterPhone} className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  To continue, please enter your registered mobile number to receive your OTP verification code.
                </p>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. +91 9876543210"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm"
                  />
                </div>
                {errorMsg && <p className="text-xs text-rose-500 font-semibold">{errorMsg}</p>}
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm shadow-sm transition-all"
                  >
                    {loading ? "Sending..." : "Send OTP"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-normal">
                  We've sent a 6-digit OTP code to your <span className="font-semibold text-slate-900 dark:text-white">{otpSentTo === "email" ? "Email Address" : "Mobile Number"}</span> ({otpChannelDetail}).
                </p>
                {debugOtp && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl text-xs text-amber-800 dark:text-amber-300 font-medium">
                    🔑 <strong>Developer Demo Helper:</strong> The generated code sent to your mock channel is <span className="font-bold underline text-sm tracking-wider text-amber-900 dark:text-amber-200 ml-1">{debugOtp}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                    One-Time Password (OTP)
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-center tracking-[1em] text-lg font-bold"
                  />
                </div>
                {errorMsg && <p className="text-xs text-rose-500 font-semibold">{errorMsg}</p>}
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowOtpModal(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm shadow-sm transition-all"
                  >
                    {loading ? "Verifying..." : "Verify Code"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
