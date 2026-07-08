import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import userroutes from "./routes/auth.js";
import videoroutes from "./routes/video.js";
import likeroutes from "./routes/like.js";
import watchlaterroutes from "./routes/watchlater.js";
import historyrroutes from "./routes/history.js";
import commentroutes from "./routes/comment.js";
import downloadroutes from "./routes/download.js";
import paymentroutes from "./routes/payment.js";
dotenv.config();
const app = express();
import path from "path";
const allowedOrigins = [
  "http://localhost:3000",
  "https://clone-youtube-lrby.vercel.app",
  /https:\/\/clone-youtube-.*\.vercel\.app$/,
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const isAllowed = allowedOrigins.some((o) =>
        typeof o === "string" ? o === origin : o.test(origin)
      );
      if (isAllowed) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "30mb", extended: true }));
app.use(express.urlencoded({ limit: "30mb", extended: true }));
app.use("/uploads", express.static(path.join("uploads")));
let lastDbError = null;

app.get("/", (req, res) => {
  res.send("You tube backend is working");
});
app.get("/db-status", (req, res) => {
  const dbUrl = process.env.DB_URL;
  if (!dbUrl) {
    return res.json({ status: "disconnected", error: "DB_URL env var is missing/undefined" });
  }
  const connectionState = ["disconnected", "connected", "connecting", "disconnecting"][mongoose.connection.readyState];
  const censoredUrl = dbUrl.substring(0, Math.min(25, dbUrl.length)) + "..." + dbUrl.substring(Math.max(0, dbUrl.length - 25));
  res.json({
    status: connectionState,
    error: lastDbError,
    urlLength: dbUrl.length,
    urlPreview: censoredUrl,
    hasQuotes: dbUrl.startsWith('"') || dbUrl.startsWith("'") || dbUrl.endsWith('"') || dbUrl.endsWith("'"),
    trimmedLength: dbUrl.trim().length,
  });
});

app.get("/location", async (req, res) => {
  let clientIp = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "";
  
  if (clientIp.includes(",")) {
    clientIp = clientIp.split(",")[0].trim();
  }
  if (clientIp.startsWith("::ffff:")) {
    clientIp = clientIp.replace("::ffff:", "");
  }

  // Developer testing override
  const overrideState = req.query.overrideState || req.body.overrideState;
  if (overrideState) {
    return res.status(200).json({ city: "Override City", state: overrideState });
  }

  const isLocalIp =
    clientIp === "127.0.0.1" ||
    clientIp === "::1" ||
    clientIp.startsWith("192.168.") ||
    clientIp.startsWith("10.") ||
    clientIp.startsWith("172.16.") ||
    !clientIp;

  const queryUrl = isLocalIp
    ? "https://freeipapi.com/api/json"
    : `https://freeipapi.com/api/json/${clientIp}`;

  try {
    const apiRes = await fetch(queryUrl);
    const data = await apiRes.json();
    if (data && data.cityName) {
      return res.status(200).json({ city: data.cityName, state: data.regionName || "Tamil Nadu" });
    }
  } catch (error) {
    console.error("Error geolocating on server (freeipapi):", error.message);
  }

  const ipWhoIsUrl = isLocalIp
    ? "https://ipwho.is/"
    : `https://ipwho.is/${clientIp}`;

  try {
    const apiRes = await fetch(ipWhoIsUrl);
    const data = await apiRes.json();
    if (data && data.success && data.city) {
      return res.status(200).json({ city: data.city, state: data.region || "Tamil Nadu" });
    }
  } catch (error) {
    console.error("Error geolocating on server (ipwho.is):", error.message);
  }

  const ipApiCoUrl = isLocalIp
    ? "https://ipapi.co/json/"
    : `https://ipapi.co/${clientIp}/json/`;

  try {
    const apiRes = await fetch(ipApiCoUrl);
    const data = await apiRes.json();
    if (data && data.city && data.city !== "Reserved") {
      return res.status(200).json({ city: data.city, state: data.region || "Tamil Nadu" });
    }
  } catch (error) {
    console.error("Error geolocating on server (ipapi.co):", error.message);
  }

  return res.status(200).json({ city: "Coimbatore", state: "Tamil Nadu" });
});

app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
app.use("/download", downloadroutes);
app.use("/payment", paymentroutes);
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`server running on port ${PORT}`);
});

const DBURL = process.env.DB_URL;
if (DBURL) {
  mongoose
    .connect(DBURL)
    .then(() => {
      console.log("Mongodb connected");
      lastDbError = null;
    })
    .catch((error) => {
      console.log("Mongodb connection error:", error.message);
      lastDbError = error.message;
    });
} else {
  console.log("WARNING: DB_URL environment variable is not defined. Attempting local MongoDB connection as fallback...");
  mongoose
    .connect("mongodb://127.0.0.1:27017/youtube")
    .then(() => {
      console.log("Mongodb connected to local fallback");
      lastDbError = null;
    })
    .catch((error) => {
      console.log("Could not connect to fallback local MongoDB. Database features will be disabled until DB_URL is configured.");
      lastDbError = error.message;
    });
}
