import { Request, Response } from "express";
import { ReviewService } from "./review.services";
import { AuthRequest } from "../../middlewares/auth.middleware";

export class ReviewController {
  static async addReview(req: any, res: Response) {
    try {
      const { requestId, rating, comment } = req.body;
      const userId = req.user.userId; 

      const review = await ReviewService.createReview(
        userId,
        requestId,
        rating,
        comment
      );

      return res.status(201).json({
        success: true,
        data: review
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getMyReviews(req: AuthRequest, res: Response) {
    try {
      const expertId = req.user!.userId; 

      const reviews = await ReviewService.getExpertReviews(expertId);
      res.json(reviews);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}