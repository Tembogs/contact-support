import prisma from "../../config/prisma.js";
export class ReviewService {
    static async createReview(userId, requestId, rating, comment) {
        return await prisma.$transaction(async (tx) => {
            // 1. Verify the request
            const request = await tx.supportRequest.findUnique({
                where: { id: requestId }
            });
            if (!request)
                throw new Error("Support request not found");
            if (request.status !== "CLOSED")
                throw new Error("You can only review a closed session");
            if (request.userId !== userId)
                throw new Error("Unauthorized to review");
            // 2. Prevent duplicate 
            const existingReview = await tx.review.findUnique({
                where: { requestId: requestId }
            });
            if (existingReview)
                throw new Error("Review already exists");
            // 3. Save the review 
            const review = await tx.review.create({
                data: {
                    rating,
                    comment,
                    requestId,
                    expertId: request.expertId,
                    reviewerId: userId
                }
            });
            // 4. Calculate Average
            const allReviews = await tx.review.findMany({
                where: { expertId: request.expertId },
                select: { rating: true }
            });
            const totalRating = allReviews.reduce((acc, r) => acc + r.rating, 0);
            const avgRating = totalRating / allReviews.length;
            // 5. Update Profile
            await tx.expertProfile.update({
                where: { userId: request.expertId },
                data: { rating: avgRating }
            });
            return review;
        });
    }
    static async getExpertReviews(expertId, page = 1, limit = 10, comment) {
        const skip = (page - 1) * limit;
        const where = {
            expertId,
            ...(comment ? { comment: { contains: comment, mode: 'insensitive' } } : {})
        };
        const [reviews, totalCount, aggregateData] = await Promise.all([
            // 1. Get the actual reviews with the User's name
            prisma.review.findMany({
                where: where,
                include: {
                    reviewer: {
                        select: { email: true, id: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            // 2. Total count for pagination logic
            prisma.review.count({ where: where }),
            // 3. Statistical summary (Company Dashboard style)
            prisma.review.aggregate({
                where: { expertId },
                _avg: { rating: true },
                _count: { _all: true },
            })
        ]);
        return {
            meta: {
                total: totalCount,
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                averageRating: aggregateData._avg.rating?.toFixed(1) || 0,
            },
            data: reviews
        };
    }
}
