import express, { Router } from "express";
import { validate } from "../middlewares/validate.js";
import { loginCheckController } from "../controllers/loginCheckController.js";
import { userLoginController } from "../controllers/userLoginController.js";
import { userRegistrationController } from "../controllers/userRegistrationController.js";

const router: Router = express.Router();

router.post("/", validate("authorization"), userLoginController);
router.get("/register/:login", loginCheckController);
router.post("/register", validate("registration"), userRegistrationController);

export default router;
