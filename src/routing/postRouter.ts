import express, { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { queriesParamsValidate } from "../middlewares/queriesParamsValidate.js";
import { validate } from "../middlewares/validate.js";
import { getCommentsController } from "../controllers/getCommentsController.js";
import { postCommentAndLikesController } from "../controllers/postCommentAndLikesController.js";
import { putPublicationController } from "../controllers/putPublicationController.js";
import { deleteCommentAndLikesAndPostsImagesAndPublicationController } from "../controllers/deleteCommentAndLikesAndPostsImagesAndPublicationController.js";

const router: Router = express.Router();

router.get("/:post_id", authenticate(), getCommentsController);
router.post("/:post_id", authenticate(), queriesParamsValidate("optionalProperties"), validate("postComment"), postCommentAndLikesController);
router.put("/:post_id", authenticate(), validate("postOrUpdatePublication"), putPublicationController);
router.delete("/:post_id", authenticate(), queriesParamsValidate("optionalProperties"), deleteCommentAndLikesAndPostsImagesAndPublicationController);

export default router;
