import { Router } from "express";
import { ProfileController } from "./profile.controllers";
import { authMiddleware } from "../../middlewares/auth.middleware";

const router = Router();

router.put("/update", authMiddleware(["EXPERT"]), ProfileController.update);

router.get("/me", authMiddleware(["EXPERT"]), ProfileController.getMe);

router.get("/user/:id", authMiddleware(["USER"]), ProfileController.getUserProfile);


export default router;