import express from "express";
import { postSignal, getSignals, clearRoom } from "../controllers/signal.js";

const router = express.Router();

router.post("/post", postSignal);
router.get("/get", getSignals);
router.post("/clear", clearRoom);

export default router;
