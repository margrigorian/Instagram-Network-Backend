import express, { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { queriesParamsValidate } from "../middlewares/queriesParamsValidate.js";
import { validate } from "../middlewares/validate.js";
import { getInboxController } from "../controllers/getInboxController.js";
import { postChatController } from "../controllers/postChatController.js";

const router: Router = express.Router();

router.get("/", authenticate(), queriesParamsValidate("searchParam"), getInboxController);
router.post("/", authenticate(), validate("postChat"), postChatController);

export default router;
