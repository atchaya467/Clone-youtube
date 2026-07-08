import express from "express";
import { login, updateprofile, registerPhone, verifyOtp, getDebugOtp } from "../controllers/auth.js";
const routes = express.Router();

routes.post("/login", login);
routes.post("/register-phone", registerPhone);
routes.post("/verify-otp", verifyOtp);
routes.get("/debug-otp/:email", getDebugOtp);
routes.patch("/update/:id", updateprofile);
export default routes;
