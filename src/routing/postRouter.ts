import express, { Router } from "express";
import { getCommentsController } from "../controllers/getCommentsController.js";

const router: Router = express.Router();

router.get("/:post_id", getCommentsController);

export default router;
