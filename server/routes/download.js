import express from "express";
import { checkDownloadEligibility, getUserDownloads } from "../controllers/download.js";

const routes = express.Router();

routes.post("/check", checkDownloadEligibility);
routes.get("/user/:userId", getUserDownloads);

export default routes;
