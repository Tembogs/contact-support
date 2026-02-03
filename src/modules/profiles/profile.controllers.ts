import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware.js";
import { ProfileService } from "./profile.services.js";

export class ProfileController {
  static async update(req: AuthRequest, res: Response) {
    try {
      const profile = await ProfileService.updateProfile(req.user!.userId, req.body);
      res.json({ message: "Profile updated!", profile });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getMe(req: AuthRequest, res: Response) {
    try {
      const profile = await ProfileService.getProfile(req.user!.userId);
      res.json(profile);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  static async getUserProfile(req: AuthRequest, res: Response) {
      try {
        const profile = await ProfileService.getUserProfile(req.params.id);
        res.json(profile);
      } catch (error: any) {
        res.status(404).json({ message: error.message });
      }
  }
}