import request from "supertest";
import app from "../../../app";
import prisma from "../../../config/prisma";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

const sign = (id: string, role: Role) =>
  jwt.sign({ userId: id, role }, process.env.JWT_SECRET!);

describe("RequestController", () => {
  let userToken: string;
  let expertToken: string;
  let requestId: string;
  let userId: string;
  let expertId: string;

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
        email: "ctrl-user@test.com",
        passwordHash: "123",
        role: Role.USER,
      },
    });

    const expert = await prisma.user.create({
      data: {
        email: "ctrl-expert@test.com",
        passwordHash: "123",
        role: Role.EXPERT,
      },
    });

    userId = user.id;
    expertId = expert.id;

    await prisma.expertProfile.create({
      data: { userId: expertId, bio: "Expert" },
    });

    userToken = sign(userId, Role.USER);
    expertToken = sign(expertId, Role.EXPERT);
  });

  afterAll(async () => prisma.$disconnect());

  it("user creates request", async () => {
    const res = await request(app)
      .post("/api/request")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(201);

    requestId = res.body.id;
  });

  it("expert accepts", async () => {
    await request(app)
      .post(`/api/request/${requestId}/accept`)
      .set("Authorization", `Bearer ${expertToken}`)
      .expect(200);
  });

  it("expert closes", async () => {
    await request(app)
      .post(`/api/request/${requestId}/close`)
      .set("Authorization", `Bearer ${expertToken}`)
      .expect(200);
  });

  it("user gets closed requests", async () => {
    const res = await request(app)
      .get("/api/request/closed")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThan(0);
  });
});
