import express, { Router } from "express";
import { authenticate } from "../middlewares/authenticate.js";
import { queriesParamsValidate } from "../middlewares/queriesParamsValidate.js";
import { validate } from "../middlewares/validate.js";
import { getInboxController } from "../controllers/getInboxController.js";
import { postChatController } from "../controllers/postChatController.js";
import { getMessagesController } from "../controllers/getMessagesController.js";
import { postMessageController } from "../controllers/postMessageController.js";
import { deleteMessageOrInfoAboutMessageAsUnreadOrGroupParticipantOrChatController } from "../controllers/deleteMessageOrInfoAboutMessageAsUnreadOrGroupParticipantOrChatController.js";

const router: Router = express.Router();

router.get("/", authenticate(), queriesParamsValidate("searchParam"), getInboxController);
router.post("/", authenticate(), validate("postChat"), postChatController);
router.get("/:id", authenticate(), queriesParamsValidate("chatAndSearchParams"), getMessagesController);
router.post("/:id", authenticate(), queriesParamsValidate("chatAndSearchParams"), validate("postMessage"), postMessageController);
router.delete(
  "/:id",
  authenticate(),
  queriesParamsValidate("chatAndSearchParams"),
  deleteMessageOrInfoAboutMessageAsUnreadOrGroupParticipantOrChatController
);

export default router;
