import express, { Router } from "express";
import { loginCheckController } from "../controllers/loginCheckController.js";

const router: Router = express.Router();

router.get("/register/:login", loginCheckController);

export default router;
