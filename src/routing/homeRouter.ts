import express, { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { queriesParamsValidate } from "../middlewares/queriesParamsValidate.js";
import { homeController } from "../controllers/homeController.js";

const router: Router = express.Router();

router.get("/", authenticate(), queriesParamsValidate("searchParam"), homeController);

export default router;
