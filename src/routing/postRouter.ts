import express, { Router } from "express";
import { getCommentsController } from "../controllers/getCommentsController.js";
import { postCommentAndLikesController } from "../controllers/postCommentAndLikesController.js";
import { authenticate } from "../middlewares/authenticate.js";
import { queriesParamsValidate } from "../middlewares/queriesParamsValidate.js";
import { validate } from "../middlewares/validate.js";

const router: Router = express.Router();

router.get("/:post_id", getCommentsController);
router.post("/:post_id", authenticate(), queriesParamsValidate("optionalProperties"), validate("postComment"), postCommentAndLikesController);

export default router;
