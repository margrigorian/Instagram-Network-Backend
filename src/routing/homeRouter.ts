import express, { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { queriesParamsValidate } from "../middlewares/queriesParamsValidate.js";
import { homeController } from "../controllers/homeController.js";
import { postLikeOrSubscriptionOnAccountFromHomePageController } from "../controllers/postLikeOrSubscriptionOnAccountFromHomePageController.js";
import { deleteLikeFromPostOrSubscriptionOnAccountFromHomePageController } from "../controllers/deleteLikeFromPostOrSubscriptionOnAccountFromHomePageController.js";

const router: Router = express.Router();

router.get("/", authenticate(), queriesParamsValidate("searchParam"), homeController);
router.post("/", authenticate(), queriesParamsValidate("optionalProperties"), postLikeOrSubscriptionOnAccountFromHomePageController);
router.delete("/", authenticate(), queriesParamsValidate("optionalProperties"), deleteLikeFromPostOrSubscriptionOnAccountFromHomePageController);

export default router;
