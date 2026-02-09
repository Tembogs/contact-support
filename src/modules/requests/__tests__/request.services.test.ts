import prisma from "../../../config/prisma";
import { RequestService } from "../request.service";
import { Role, RequestStatus } from "@prisma/client";

describe("RequestService", () => {
  let userId: string;
  let expertId: string;
  let requestId: string;

  beforeAll(async () => {
    await prisma.message.deleteMany();
    await prisma.review.deleteMany();
    await prisma.session.deleteMany();
    await prisma.supportRequest.deleteMany();
    await prisma.skill.deleteMany();
    await prisma.expertProfile.deleteMany();
    await prisma.user.deleteMany();

    const user = await prisma.user.create({
      data: {
        email: "user@req.com",
        passwordHash: "123",
        role: Role.USER,
      },
    });

    const expert = await prisma.user.create({
      data: {
        email: "expert@req.com",
        passwordHash: "123",
        role: Role.EXPERT,
      },
    });

    userId = user.id;
    expertId = expert.id;

    await prisma.expertProfile.create({
      data: {
        userId: expertId,
        bio: "Expert",
        isAvailable: true,
      },
    });

    const req = await RequestService.createRequest(userId);
    requestId = req.id;
  });

  afterAll(async () => prisma.$disconnect());

  it("creates request with REQUESTED", async () => {
    const req = await RequestService.createRequest(userId);

    expect(req.status).toBe(RequestStatus.REQUESTED);
  });

  it("expert accepts request", async () => {
    const updated = await RequestService.acceptRequest(requestId, expertId);

    expect(updated.status).toBe("ACCEPTED");
    expect(updated.expertId).toBe(expertId);

    const profile = await prisma.expertProfile.findUnique({
      where: { userId: expertId },
    });

    expect(profile?.isAvailable).toBe(false);
  });

  it("closes request and frees expert", async () => {
    await prisma.supportRequest.update({
      where: { id: requestId },
      data: { status: "ACTIVE" },
    });

    const closed = await RequestService.closeRequest(requestId, expertId);

    expect(closed.status).toBe("CLOSED");

    const profile = await prisma.expertProfile.findUnique({
      where: { userId: expertId },
    });

    expect(profile?.isAvailable).toBe(true);
  });

  it("blocks invalid transitions", async () => {
    await expect(
      RequestService.transitionRequest(
        requestId,
        userId,
        "USER",
        "ACTIVE"
      )
    ).rejects.toThrow();
  });

  it("returns open requests", async () => {
    const user2 = await prisma.user.create({
      data: {
        email: "u2@req.com",
        passwordHash: "123",
        role: Role.USER,
      },
    });

    await RequestService.createRequest(user2.id);

    const open = await RequestService.getOpenRequests();

    expect(open.length).toBeGreaterThan(0);
  });
});
