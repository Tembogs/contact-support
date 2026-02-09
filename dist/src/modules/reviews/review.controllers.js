import { ReviewService } from "./review.services";
export class ReviewController {
    static async addReview(req, res) {
        try {
            const { requestId, rating, comment } = req.body;
            const userId = req.user.userId;
            const review = await ReviewService.createReview(userId, requestId, rating, comment);
            return res.status(201).json({
                success: true,
                data: review
            });
        }
        catch (error) {
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }
    static async getMyReviews(req, res) {
        try {
            const expertId = req.user.userId;
            const reviews = await ReviewService.getExpertReviews(expertId);
            res.json(reviews);
        }
        catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}
