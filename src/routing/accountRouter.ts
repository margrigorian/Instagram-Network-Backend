import express, { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { queriesParamsValidate } from "../middlewares/queriesParamsValidate.js";
import { accountController } from "../controllers/accountController.js";
import { postSubscriptionOnUserController } from "../controllers/postSubscriptionOnUserController.js";
import { getFollowersController } from "../controllers/getFollowersController.js";
import { postSubscriptionOnFollowerController } from "../controllers/postSubscriptionOnFollowerController.js";
import { getFollowingsController } from "../controllers/getFollowingsController.js";
import { postSubscriptionOnFollowingController } from "../controllers/postSubscriptionOnFollowingController.js";

const router: Router = express.Router();

router.get("/:login", accountController);
router.post("/:login", authenticate(), postSubscriptionOnUserController);
router.get("/:login/followers", authenticate(), queriesParamsValidate("searchParam"), getFollowersController);
router.post("/:login/followers", authenticate(), queriesParamsValidate("loginOfFollowing"), postSubscriptionOnFollowerController);
router.get("/:login/following", authenticate(), queriesParamsValidate("searchParam"), getFollowingsController);
router.post("/:login/following", authenticate(), queriesParamsValidate("loginOfFollowing"), postSubscriptionOnFollowingController);

export default router;
