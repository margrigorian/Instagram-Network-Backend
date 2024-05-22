import express, { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import avatarUpload from "../middlewares/avatarUpload.js";
import { postUserAvatarController } from "../controllers/postUserAvatarController.js";

const router: Router = express.Router();

// при другом порядке middlewares req.body оказывается пустым, upload обнуляет
router.post("/edit", avatarUpload.single("image"), authenticate(), postUserAvatarController);

export default router;
