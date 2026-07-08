import mongoose from "mongoose";
import users from "../Modals/Auth.js";
import nodemailer from "nodemailer";

const getClientIp = (req) => {
  let ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  if (ip.includes(",")) {
    ip = ip.split(",")[0].trim();
  }
  if (ip.startsWith("::ffff:")) {
    ip = ip.replace("::ffff:", "");
  }
  return ip;
};

const detectStateByIp = async (ip) => {
  const isLocalIp =
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.16.") ||
    !ip;

  const freeIpApiUrl = isLocalIp
    ? "https://freeipapi.com/api/json"
    : `https://freeipapi.com/api/json/${ip}`;

  try {
    const res = await fetch(freeIpApiUrl);
    const data = await res.json();
    if (data && data.regionName) {
      return data.regionName;
    }
  } catch (e) {
    console.error("Freeipapi failed:", e.message);
  }

  const ipWhoIsUrl = isLocalIp
    ? "https://ipwho.is/"
    : `https://ipwho.is/${ip}`;
  try {
    const res = await fetch(ipWhoIsUrl);
    const data = await res.json();
    if (data && data.success && data.region) {
      return data.region;
    }
  } catch (e) {
    console.error("Ipwho.is failed:", e.message);
  }

  const ipApiCoUrl = isLocalIp
    ? "https://ipapi.co/json/"
    : `https://ipapi.co/${ip}/json/`;
  try {
    const res = await fetch(ipApiCoUrl);
    const data = await res.json();
    if (data && data.region) {
      return data.region;
    }
  } catch (e) {
    console.error("Ipapi failed:", e.message);
  }

  return "Tamil Nadu"; // Default fallback
};

const sendOtpEmail = async (email, otp, name) => {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || "YourTube <no-reply@yourtube.com>";

  const emailBody = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
      <h2 style="color: #EA580C; border-bottom: 2px solid #EA580C; padding-bottom: 10px;">YourTube - OTP Verification</h2>
      <p>Dear <strong>${name}</strong>,</p>
      <p>Your one-time password (OTP) for logging into YourTube is:</p>
      <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #EA580C; margin: 25px 0; text-align: center;">${otp}</div>
      <p>This code is valid for the next 10 minutes. Please do not share this OTP with anyone.</p>
      <hr style="border: 0; border-top: 1px solid #e0e0e0; margin-top: 20px;" />
      <p style="font-size: 11px; color: #888; text-align: center;">If you did not request this code, please ignore this email.</p>
    </div>
  `;

  if (host && user && pass) {
    try {
      const transporter = nodemailer.createTransport({
        host,
        port,
        secure: Number(port) === 465,
        auth: { user, pass },
      });
      await transporter.sendMail({
        from,
        to: email,
        subject: "YourTube Login Verification Code",
        html: emailBody,
      });
      console.log(`OTP verification email sent to ${email}.`);
    } catch (e) {
      console.error("SMTP failed, logging OTP to console:", e.message);
      logMockOtp(email, otp);
    }
  } else {
    console.log("SMTP not configured. Logging OTP to console.");
    logMockOtp(email, otp);
  }
};

const logMockOtp = (email, otp) => {
  console.log("================ MOCK EMAIL OTP START ================");
  console.log(`TO: ${email}`);
  console.log(`OTP: ${otp}`);
  console.log("================= MOCK EMAIL OTP END =================");
};

const sendOtpSms = (phone, otp) => {
  console.log("================ MOCK SMS OTP START ================");
  console.log(`TO MOBILE: ${phone}`);
  console.log(`OTP: ${otp}`);
  console.log(`MESSAGE: YourTube verification code is ${otp}. Valid for 10 minutes.`);
  console.log("================= MOCK SMS OTP END =================");
};

export const login = async (req, res) => {
  const { email, name, image, overrideState } = req.body;

  try {
    let user = await users.findOne({ email });

    if (!user) {
      user = await users.create({ email, name, image });
    }

    // Detect user state
    const clientIp = getClientIp(req);
    const state = overrideState || await detectStateByIp(clientIp);
    console.log(`User login detected from IP: ${clientIp}, State: ${state}`);

    const southIndiaStates = [
      "tamil nadu",
      "kerala",
      "karnataka",
      "andhra pradesh",
      "telangana"
    ];

    const isSouthIndia = southIndiaStates.includes(state.toLowerCase());
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (isSouthIndia) {
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();

      await sendOtpEmail(user.email, otp, user.name || "User");

      return res.status(200).json({
        requireOtp: true,
        otpSentTo: "email",
        email: user.email,
        tempUserId: user._id,
      });
    } else {
      if (!user.phone) {
        return res.status(200).json({
          requirePhoneRegistration: true,
          email: user.email,
          tempUserId: user._id,
        });
      } else {
        user.otp = otp;
        user.otpExpiry = otpExpiry;
        await user.save();

        sendOtpSms(user.phone, otp);

        return res.status(200).json({
          requireOtp: true,
          otpSentTo: "mobile",
          phone: user.phone,
          tempUserId: user._id,
        });
      }
    }
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const registerPhone = async (req, res) => {
  const { userId, phone } = req.body;
  if (!userId || !phone) {
    return res.status(400).json({ message: "userId and phone are required" });
  }

  try {
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.phone = phone;
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    sendOtpSms(phone, otp);

    return res.status(200).json({
      success: true,
      message: "Phone registered and OTP sent successfully.",
      requireOtp: true,
      otpSentTo: "mobile",
      phone: phone,
    });
  } catch (error) {
    console.error("Register phone error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const verifyOtp = async (req, res) => {
  const { userId, code } = req.body;
  if (!userId || !code) {
    return res.status(400).json({ message: "userId and code are required" });
  }

  try {
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!user.otp || !user.otpExpiry || user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP has expired. Please log in again." });
    }

    if (user.otp !== code) {
      return res.status(400).json({ message: "Invalid OTP code." });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    return res.status(200).json({
      success: true,
      result: user,
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const updateprofile = async (req, res) => {
  const { id: _id } = req.params;
  const { channelname, description } = req.body;
  if (!mongoose.Types.ObjectId.isValid(_id)) {
    return res.status(500).json({ message: "User unavailable..." });
  }
  try {
    const updatedata = await users.findByIdAndUpdate(
      _id,
      {
        $set: {
          channelname: channelname,
          description: description,
        },
      },
      { new: true }
    );
    return res.status(201).json(updatedata);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
