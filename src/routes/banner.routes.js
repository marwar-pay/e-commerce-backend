import express from "express";
import { isAdmin } from "../middleware/isAdmin.js";
import upload from "../middleware/multerConfig.js";
import {
  createBanner,
  getBanner,
  updateBanner,
} from "../controller/banner.controller.js";

const bannerRoutes = express.Router();

bannerRoutes.post("/", isAdmin, upload.single("image"), createBanner);
bannerRoutes.get("/:page", getBanner);
bannerRoutes.put("/:id", isAdmin, upload.single("image"), updateBanner);

export default bannerRoutes;
