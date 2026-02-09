import { prisma } from "../../../config/prisma";
import { AdminService } from "../admin.services";
import { Role, RequestStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

describe("AdminService", () => {
  let testUserId: string;

  beforeAll(async () => {
    // Clean up relevant tables
    await prisma.message.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.supportRequest.deleteMany({});
    await prisma.skill.deleteMany({});
    await prisma.expertProfile.deleteMany({});
    await prisma.user.deleteMany({});


    // Seed a normal user
    const passwordHash = await bcrypt.hash("UserPass123", 10);
    const user = await prisma.user.create({
      data: {
        email: "user@test.com",
        passwordHash,
        role: Role.USER,
        name: "TestUser",
      },
    });
    testUserId = user.id;

    // Seed some support requests for dashboard stats
    await prisma.supportRequest.createMany({
      data: [
        { userId: testUserId, status: RequestStatus.REQUESTED },
        { userId: testUserId, status: RequestStatus.ACTIVE },
        { userId: testUserId, status: RequestStatus.ACTIVE },
      ],
    });
  });

  afterAll(async () => {
    // Cleanup
    await prisma.message.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.supportRequest.deleteMany({});
    await prisma.skill.deleteMany({});
    await prisma.expertProfile.deleteMany({});
    await prisma.user.deleteMany({});

  });

  describe("promoteToExpert", () => {
    it("should promote a USER to EXPERT and create ExpertProfile", async () => {
      const promotedUser = await AdminService.promoteToExpert(testUserId);

      expect(promotedUser.role).toBe(Role.EXPERT);

      const expertProfile = await prisma.expertProfile.findUnique({
        where: { userId: testUserId },
      });

      expect(expertProfile).toBeDefined();
      expect(expertProfile?.isAvailable).toBe(true);
      expect(expertProfile?.bio).toBe("New Expert - Bio pending update");
    });
  });

  describe("getSystemStats", () => {
    it("should return total users, total requests, and active chats", async () => {
      const stats = await AdminService.getSystemStats();

      expect(stats.totalUsers).toBeGreaterThanOrEqual(1); // at least the promoted user
      expect(stats.totalRequests).toBe(3);
      expect(stats.activeChats).toBe(2); // two ACTIVE requests
    });
  });
});
