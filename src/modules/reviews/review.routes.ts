import { Router } from "express";
import { ReviewController } from "./review.controllers.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authMiddleware(["USER"]), ReviewController.addReview);

router.get("/expert/:expertId",authMiddleware(["EXPERT"]), ReviewController.getMyReviews); 

export default router;