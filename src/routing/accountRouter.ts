import express, { Router } from "express";
import { accountController } from "../controllers/accountController.js";

const router: Router = express.Router();

router.get("/:login", accountController);

export default router;
