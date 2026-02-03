import { Router } from "express";
import { ProfileController } from "./profile.controllers.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";

const router = Router();

router.put("/update", authMiddleware(["EXPERT"]), ProfileController.update);

router.get("/me", authMiddleware(["EXPERT"]), ProfileController.getMe);

router.get("/user/:id", authMiddleware(["USER"]), ProfileController.getUserProfile);


export default router;