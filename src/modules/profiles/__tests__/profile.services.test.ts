import prisma from "../../../config/prisma";
import { ProfileService } from "../profile.services";
import { Role, RequestStatus } from "@prisma/client";

describe("ProfileService", () => {
  let userId: string;
  let expertId: string;
  let requestId: string;

  beforeAll(async () => {
    // Clean relevant tables
    await prisma.message.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.supportRequest.deleteMany({});
    await prisma.skill.deleteMany({});
    await prisma.expertProfile.deleteMany({});
    await prisma.user.deleteMany({});

    // Create a user
    const user = await prisma.user.create({
      data: { email: "user@test.com", passwordHash: "123", role: Role.USER },
    });
    userId = user.id;

    // Create an expert
    const expert = await prisma.user.create({
      data: { email: "expert@test.com", passwordHash: "123", role: Role.EXPERT },
    });
    expertId = expert.id;

    // Expert profile
    await prisma.expertProfile.create({
      data: { userId: expertId, bio: "Expert Bio", isAvailable: true, rating: 0 },
    });

    // Create a closed support request for review
    const request = await prisma.supportRequest.create({
      data: { userId, expertId, status: RequestStatus.CLOSED },
    });
    requestId = request.id;

    // Create a review tied to this request
    await prisma.review.create({
      data: {
        rating: 5,
        requestId: requestId,
        expertId: expertId,
        reviewerId: userId,
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("should update expert profile with new bio and skills", async () => {
    const updatedProfile = await ProfileService.updateProfile(expertId, {
      bio: "Updated Bio",
      skills: ["JavaScript", "TypeScript"],
    });

    expect(updatedProfile).toBeDefined();
    expect(updatedProfile.bio).toBe("Updated Bio");

    const skills = await prisma.skill.findMany({ where: { expertId: updatedProfile.id } });
    expect(skills).toHaveLength(2);
    expect(skills.map(s => s.name)).toContain("JavaScript");
  });

  it("should fetch the expert profile with calculated rating", async () => {
    const profile = await ProfileService.getProfile(expertId);

    expect(profile).toBeDefined();
    expect(profile.bio).toBe("Updated Bio");
    expect(profile.skills).toBeDefined();
    expect(profile.calculatedRating).toBe("5.0");
  });

  it("should fetch basic user profile", async () => {
    const userProfile = await ProfileService.getUserProfile(userId);

    expect(userProfile).toBeDefined();
    expect(userProfile.email).toBe("user@test.com");
    expect(userProfile.role).toBe("USER");
  });
});
