import express, { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { queriesParamsValidate } from "../middlewares/queriesParamsValidate.js";
import { accountController } from "../controllers/accountController.js";
import { postSubscriptionOnUserController } from "../controllers/postSubscriptionOnUserController.js";
import { deleteSubscriptionOnUserController } from "../controllers/deleteSubscriptionOnUserController.js";
import { getFollowersController } from "../controllers/getFollowersController.js";
import { postSubscriptionOnFollowerController } from "../controllers/postSubscriptionOnFollowerController.js";
import { deleteSubscriptionOnFollowerController } from "../controllers/deleteSubscriptionOnFollowerController.js";
import { getFollowingsController } from "../controllers/getFollowingsController.js";
import { postSubscriptionOnFollowingController } from "../controllers/postSubscriptionOnFollowingController.js";
import { deleteSubscriptionOnFollowingController } from "../controllers/deleteSubscriptionOnFollowingController.js";

const router: Router = express.Router();

router.get("/:login", queriesParamsValidate("searchParam"), accountController);
router.post("/:login", authenticate(), postSubscriptionOnUserController);
router.delete("/:login", authenticate(), deleteSubscriptionOnUserController);
router.get("/:login/followers", authenticate(), queriesParamsValidate("searchParam"), getFollowersController);
router.post("/:login/followers", authenticate(), queriesParamsValidate("loginOfFollowing"), postSubscriptionOnFollowerController);
router.delete("/:login/followers", authenticate(), queriesParamsValidate("loginOfFollowing"), deleteSubscriptionOnFollowerController);
router.get("/:login/following", authenticate(), queriesParamsValidate("searchParam"), getFollowingsController);
router.post("/:login/following", authenticate(), queriesParamsValidate("loginOfFollowing"), postSubscriptionOnFollowingController);
router.delete("/:login/following", authenticate(), queriesParamsValidate("loginOfFollowing"), deleteSubscriptionOnFollowingController);

export default router;
