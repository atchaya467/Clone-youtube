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
app.get("/", (req, res) => {
  res.send("You tube backend is working");
});
app.use(bodyParser.json());
app.use("/user", userroutes);
app.use("/video", videoroutes);
app.use("/like", likeroutes);
app.use("/watch", watchlaterroutes);
app.use("/history", historyrroutes);
app.use("/comment", commentroutes);
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
    })
    .catch((error) => {
      console.log("Mongodb connection error:", error.message);
    });
} else {
  console.log("WARNING: DB_URL environment variable is not defined. Attempting local MongoDB connection as fallback...");
  mongoose
    .connect("mongodb://127.0.0.1:27017/youtube")
    .then(() => {
      console.log("Mongodb connected to local fallback");
    })
    .catch((error) => {
      console.log("Could not connect to fallback local MongoDB. Database features will be disabled until DB_URL is configured.");
    });
}
