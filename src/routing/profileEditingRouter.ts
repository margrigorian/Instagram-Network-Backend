import express, { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import avatarUpload from "../middlewares/avatarUpload.js";
import { postUserAvatarController } from "../controllers/postUserAvatarController.js";
import { putUserAvatarAndUserInfoController } from "../controllers/putUserAvatarAndUserInfoController .js";
import { deleteUserAvatarController } from "../controllers/deleteUserAvatarController.js";

const router: Router = express.Router();

// при другом порядке middlewares req.body оказывается пустым, upload обнуляет
router.post("/edit", avatarUpload.single("image"), authenticate(), postUserAvatarController);
router.put("/edit", avatarUpload.single("image"), authenticate(), validate("userInformationUpdate"), putUserAvatarAndUserInfoController);
router.delete("/edit", authenticate(), deleteUserAvatarController);

export default router;
