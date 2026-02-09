import prisma from "../../../config/prisma";
import { ReviewService } from "../review.services";
import { Role, RequestStatus } from "@prisma/client";
describe("ReviewService", () => {
    let userId;
    let expertId;
    let requestId;
    beforeAll(async () => {
        await prisma.review.deleteMany({});
        await prisma.supportRequest.deleteMany({});
        await prisma.expertProfile.deleteMany({});
        await prisma.user.deleteMany({});
        const user = await prisma.user.create({
            data: {
                email: "review-user@test.com",
                passwordHash: "123",
                role: Role.USER,
            },
        });
        userId = user.id;
        const expert = await prisma.user.create({
            data: {
                email: "review-expert@test.com",
                passwordHash: "123",
                role: Role.EXPERT,
            },
        });
        expertId = expert.id;
        await prisma.expertProfile.create({
            data: {
                userId: expertId,
                bio: "Expert",
                rating: 0,
            },
        });
        const request = await prisma.supportRequest.create({
            data: {
                userId,
                expertId,
                status: RequestStatus.CLOSED,
            },
        });
        requestId = request.id;
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    it("creates a review and updates expert rating", async () => {
        const review = await ReviewService.createReview(userId, requestId, 5, "Great help");
        expect(review.rating).toBe(5);
        expect(review.comment).toBe("Great help");
        const profile = await prisma.expertProfile.findUnique({
            where: { userId: expertId },
        });
        expect(profile?.rating).toBe(5);
    });
    it("prevents duplicate reviews", async () => {
        await expect(ReviewService.createReview(userId, requestId, 4)).rejects.toThrow("Review already exists");
    });
    it("rejects if request is not CLOSED", async () => {
        const req = await prisma.supportRequest.create({
            data: {
                userId,
                expertId,
                status: RequestStatus.ACTIVE,
            },
        });
        await expect(ReviewService.createReview(userId, req.id, 4)).rejects.toThrow("closed session");
    });
    it("returns expert reviews with pagination", async () => {
        const result = await ReviewService.getExpertReviews(expertId);
        expect(result.meta.total).toBeGreaterThan(0);
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.meta.averageRating).toBeDefined();
    });
});
