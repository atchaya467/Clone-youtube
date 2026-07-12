import video from "../Modals/video.js";

export const uploadvideo = async (req, res) => {
  const videoFile = req.files?.["file"]?.[0] || req.file;
  const thumbnailFile = req.files?.["thumbnail"]?.[0];

  if (!videoFile) {
    return res
      .status(400)
      .json({ message: "plz upload a mp4 video file only" });
  } else {
    try {
      const file = new video({
        videotitle: req.body.videotitle,
        filename: videoFile.originalname,
        filepath: videoFile.path,
        filetype: videoFile.mimetype,
        filesize: videoFile.size,
        videochanel: req.body.videochanel,
        uploader: req.body.uploader,
        thumbnailpath: thumbnailFile ? thumbnailFile.path : "",
      });
      await file.save();
      return res.status(201).json("file uploaded successfully");
    } catch (error) {
      console.error(" error:", error);
      return res.status(500).json({ message: "Something went wrong" });
    }
  }
};
export const getallvideo = async (req, res) => {
  try {
    let files = await video.find();
    if (files.length === 0) {
      const MOCK_VIDEOS = [
        {
          _id: "66851f5c6e84d412e8790001",
          videotitle: "Amazing Nature Documentary",
          filename: "nature-doc.mp4",
          filetype: "video/mp4",
          filepath: "/video/vdo.mp4",
          filesize: "500MB",
          videochanel: "Nature Channel",
          Like: 1250,
          views: 45000,
          uploader: "nature_lover",
        },
        {
          _id: "66851f5c6e84d412e8790002",
          videotitle: "Cooking Tutorial: Perfect Pasta",
          filename: "pasta-tutorial.mp4",
          filetype: "video/mp4",
          filepath: "/video/vdo.mp4",
          filesize: "300MB",
          videochanel: "Chef's Kitchen",
          Like: 890,
          views: 23000,
          uploader: "chef_master",
        }
      ];
      await video.insertMany(MOCK_VIDEOS);
      files = await video.find();
    }
    return res.status(200).send(files);
  } catch (error) {
    console.error(" error:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const deletevideo = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedVideo = await video.findByIdAndDelete(id);
    if (!deletedVideo) {
      return res.status(404).json({ message: "Video not found" });
    }
    return res.status(200).json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};
