import express, { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { loginCheckController } from "../controllers/loginCheckController.js";
import { userRegistrationController } from "../controllers/userRegistrationController.js";

const router: Router = express.Router();

router.get("/register/:login", loginCheckController);
router.post("/register", validate("registration"), userRegistrationController);

export default router;
