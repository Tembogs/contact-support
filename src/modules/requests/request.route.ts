
import { Router } from "express";
import { RequestController } from "./request.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";


const router = Router();

router.post("/", authMiddleware(["USER"]), RequestController.create);

router.post("/:id/transition", authMiddleware(["USER", "EXPERT"]), RequestController.transition);

router.get("/pending", authMiddleware(["EXPERT"]), RequestController.getPending);

router.post("/:id/accept", authMiddleware(["EXPERT"]), RequestController.accept);

router.post("/:id/close", authMiddleware(["EXPERT"]), RequestController.close);

router.post("/:id/reject", authMiddleware(["EXPERT"]), RequestController.reject);

router.get("/accepted", authMiddleware(["USER", "EXPERT"]), RequestController.getAccepted);

router.get("/closed", authMiddleware(["USER", "EXPERT"]), RequestController.getClosed);

router.post("/:id/cancel", authMiddleware(["USER"]), RequestController.cancel);
export default router;

