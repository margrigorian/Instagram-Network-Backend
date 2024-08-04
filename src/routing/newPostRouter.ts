import express, { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { validate } from "../middlewares/validate.js";
import postImageUpload from "../middlewares/postImageUpload.js";
import { postNewPublication } from "../controllers/postNewPublicationController.js";

const router: Router = express.Router();

// при другом порядке middlewares req.body оказывается пустым, upload обнуляет
router.post("/", postImageUpload.array("images", 10), authenticate(), validate("postPublication"), postNewPublication);

export default router;
