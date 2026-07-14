import express from "express";
import {
  getallhistoryVideo,
  handlehistory,
  handleview,
  deleteHistoryEntry,
} from "../controllers/history.js";

const routes = express.Router();
routes.get("/:userId", getallhistoryVideo);
routes.post("/views/:videoId", handleview);
routes.post("/:videoId", handlehistory);
routes.delete("/:historyId", deleteHistoryEntry);
export default routes;
