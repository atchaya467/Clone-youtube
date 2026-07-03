import download from "../Modals/download.js";
import users from "../Modals/Auth.js";
import mongoose from "mongoose";

export const checkDownloadEligibility = async (req, res) => {
  const { userId, videoId } = req.body;

  if (!userId || !videoId) {
    return res.status(400).json({ message: "userId and videoId are required" });
  }

  try {
    const user = await users.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isPremium) {
      // Premium user has unlimited downloads. Save the download record.
      await download.create({ viewer: userId, videoid: videoId });
      return res.status(200).json({ allowed: true, message: "Download allowed (Premium)" });
    }

    // Free user daily limit check (1 download per UTC day)
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const downloadsTodayCount = await download.countDocuments({
      viewer: userId,
      downloadedAt: { $gte: startOfToday },
    });

    if (downloadsTodayCount >= 1) {
      return res.status(403).json({
        allowed: false,
        message: "Free daily limit reached. Please upgrade to Premium.",
      });
    }

    // Save download record for free user
    await download.create({ viewer: userId, videoid: videoId });
    return res.status(200).json({ allowed: true, message: "Download allowed (1 free download per day)" });
  } catch (error) {
    console.error("Error in checkDownloadEligibility:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserDownloads = async (req, res) => {
  const { userId } = req.params;

  try {
    const userDownloads = await download
      .find({ viewer: userId })
      .populate({
        path: "videoid",
        model: "videofiles",
      })
      .exec();

    // Map to get unique videos downloaded by this user
    const uniqueDownloadsMap = new Map();
    userDownloads.forEach((dl) => {
      if (dl.videoid) {
        uniqueDownloadsMap.set(dl.videoid._id.toString(), dl.videoid);
      }
    });

    return res.status(200).json(Array.from(uniqueDownloadsMap.values()));
  } catch (error) {
    console.error("Error in getUserDownloads:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
