import express from "express";
import { deletevideo, getallvideo, uploadvideo } from "../controllers/video.js";
import upload from "../filehelper/filehelper.js";

const routes = express.Router();

routes.post(
  "/upload",
  upload.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  uploadvideo
);
routes.get("/getall", getallvideo);
routes.delete("/delete/:id", deletevideo);
export default routes;
