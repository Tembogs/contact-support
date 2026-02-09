import prisma from "../../../config/prisma";
import { ProfileService } from "../profile.services";
import { Role } from "@prisma/client";
describe("ProfileService", () => {
    let expertId;
    let userId;
    beforeAll(async () => {
        // Clean tables
        await prisma.message.deleteMany({});
        await prisma.review.deleteMany({});
        await prisma.session.deleteMany({});
        await prisma.supportRequest.deleteMany({});
        await prisma.skill.deleteMany({});
        await prisma.expertProfile.deleteMany({});
        await prisma.user.deleteMany({});
        // Create expert user
        const expert = await prisma.user.create({
            data: {
                email: "expert@test.com",
                passwordHash: "123",
                role: Role.EXPERT,
            },
        });
        expertId = expert.id;
        // Create regular user
        const user = await prisma.user.create({
            data: {
                email: "user@test.com",
                passwordHash: "123",
                role: Role.USER,
            },
        });
        userId = user.id;
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    it("should create or update an expert profile with skills", async () => {
        const profile = await ProfileService.updateProfile(expertId, {
            bio: "I am an expert",
            skills: ["TypeScript", "Node.js"],
        });
        expect(profile).toBeDefined();
        expect(profile.userId).toBe(expertId);
        const skills = await prisma.skill.findMany({ where: { expertId: profile.id } });
        expect(skills.map(s => s.name)).toEqual(expect.arrayContaining(["TypeScript", "Node.js"]));
    });
    it("should fetch the expert profile with calculated rating", async () => {
        // Add a review to calculate rating
        const review = await prisma.review.create({
            data: {
                rating: 5,
                requestId: "req1",
                expertId,
                reviewerId: userId,
            },
        });
        const profile = await ProfileService.getProfile(expertId);
        expect(profile).toBeDefined();
        expect(profile.calculatedRating).toBe("5.0");
    });
    it("should fetch a user profile", async () => {
        const profile = await ProfileService.getUserProfile(userId);
        expect(profile).toBeDefined();
        expect(profile.email).toBe("user@test.com");
    });
});
