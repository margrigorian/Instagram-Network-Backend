import express, { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { queriesParamsValidate } from "../middlewares/queriesParamsValidate.js";
import { getExploredPostsController } from "../controllers/getExploredPostsController.js";

const router: Router = express.Router();

router.get("/", authenticate(), queriesParamsValidate("exploreParams"), getExploredPostsController);

export default router;
