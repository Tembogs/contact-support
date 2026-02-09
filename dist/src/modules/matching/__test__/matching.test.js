import prisma from "../../../config/prisma";
import { MatchingService } from "../matching.service";
import { Role, RequestStatus } from "@prisma/client";
describe("MatchingService", () => {
    let userId;
    let expertId;
    let expertProfileId;
    let requestId;
    beforeAll(async () => {
        // Clean tables
        await prisma.message.deleteMany({});
        await prisma.supportRequest.deleteMany({});
        await prisma.expertProfile.deleteMany({});
        await prisma.user.deleteMany({});
        // Create a regular user
        const user = await prisma.user.create({
            data: {
                email: "user@test.com",
                passwordHash: "123",
                role: Role.USER,
                isOnline: true,
            },
        });
        userId = user.id;
        // Create an expert user
        const expertUser = await prisma.user.create({
            data: {
                email: "expert@test.com",
                passwordHash: "123",
                role: Role.EXPERT,
                isOnline: true,
            },
        });
        expertId = expertUser.id;
        // Create expert profile
        const expertProfile = await prisma.expertProfile.create({
            data: {
                userId: expertId,
                bio: "Expert in testing",
                isAvailable: true,
                rating: 4.5,
            },
        });
        expertProfileId = expertProfile.id;
        // Create a support request
        const request = await prisma.supportRequest.create({
            data: {
                userId,
                status: RequestStatus.REQUESTED,
            },
        });
        requestId = request.id;
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    it("finds an available expert", async () => {
        const expert = await MatchingService.findavailableExpert();
        expect(expert).toBeDefined();
        expect(expert?.isAvailable).toBe(true);
        expect(expert?.user.isOnline).toBe(true);
    });
    it("assigns an expert to a support request", async () => {
        const assignedRequest = await MatchingService.assignExpertToRequest(requestId);
        expect(assignedRequest).toBeDefined();
        expect(assignedRequest.status).toBe(RequestStatus.ACCEPTED);
        expect(assignedRequest.expertId).toBe(expertId);
        const expertProfile = await prisma.expertProfile.findUnique({
            where: { id: expertProfileId },
        });
        expect(expertProfile?.isAvailable).toBe(false);
    });
});
