import { Router } from "express";
import { MessageController } from "../messages/messages.controllers";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.post("/:requestId/messages", authMiddleware(["USER", "EXPERT"]), MessageController.send);

router.get("/:requestId/messages", authMiddleware(["USER", "EXPERT"]), MessageController.getHistory);

export default router;