import request from "supertest";
import prisma from "../../../config/prisma";
import app from "../../../app";
import jwt from "jsonwebtoken";
import { Role, RequestStatus } from "@prisma/client";

/* ---------------- JWT Helper ---------------- */

const JWT_SECRET = process.env.JWT_SECRET!;

function makeToken(userId: string, role: Role) {
  return jwt.sign({ userId, role }, JWT_SECRET);
}

/* ---------------- Mock Socket.IO ---------------- */

const emitMock = jest.fn();

const ioMock = {
  to: jest.fn(() => ({
    emit: emitMock,
  })),
};

describe("MessageController", () => {
  let userId: string;
  let expertId: string;
  let requestId: string;

  let userToken: string;
  let expertToken: string;

  beforeAll(async () => {
    // Clean DB
    await prisma.message.deleteMany({});
    await prisma.review.deleteMany({});
    await prisma.session.deleteMany({});
    await prisma.supportRequest.deleteMany({});
    await prisma.skill.deleteMany({});
    await prisma.expertProfile.deleteMany({});
    await prisma.user.deleteMany({});


    // User
    const user = await prisma.user.create({
      data: {
        email: "user@test.com",
        passwordHash: "123",
        role: Role.USER,
      },
    });

    userId = user.id;
    userToken = makeToken(userId, Role.USER);

    // Expert
    const expert = await prisma.user.create({
      data: {
        email: "expert@test.com",
        passwordHash: "123",
        role: Role.EXPERT,
      },
    });

    expertId = expert.id;
    expertToken = makeToken(expertId, Role.EXPERT);

    // Expert Profile
    await prisma.expertProfile.create({
      data: {
        userId: expertId,
        bio: "Expert Bio",
        isAvailable: true,
        rating: 5,
      },
    });

    // Support Request
    const requestEntry = await prisma.supportRequest.create({
      data: {
        userId,
        expertId,
        status: RequestStatus.ACTIVE,
      },
    });

    requestId = requestEntry.id;

    // Inject mocked io into express
    app.set("io", ioMock);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    await prisma.message.deleteMany({});
  });

  /* ---------------- SEND MESSAGE ---------------- */

  it("POST /api/messages/:requestId sends message & emits socket event", async () => {
    const res = await request(app)
      .post(`/api/message/${requestId}/messages`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "Hello Controller" })
      .expect(201);

    expect(res.body.content).toBe("Hello Controller");
    expect(res.body.senderId).toBe(userId);

    expect(ioMock.to).toHaveBeenCalledWith(requestId);
    expect(emitMock).toHaveBeenCalledWith(
      "new-message",
      expect.objectContaining({
        content: "Hello Controller",
      })
    );
  });

  /* ---------------- GET HISTORY ---------------- */

  it("GET /api/messages/:requestId returns ordered history", async () => {
    // seed messages
    await request(app)
      .post(`/api/message/${requestId}/messages`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "first" });

    await request(app)
      .post(`/api/message/${requestId}/messages`)
      .set("Authorization", `Bearer ${expertToken}`)
      .send({ content: "second" });

    await request(app)
      .post(`/api/message/${requestId}/messages`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({ content: "third" });

    const res = await request(app)
      .get(`/api/message/${requestId}/messages`)
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(res.body).toHaveLength(3);
    expect(res.body[0].content).toBe("first");
    expect(res.body[1].content).toBe("second");
    expect(res.body[2].content).toBe("third");
  });

  /* ---------------- UNAUTHORIZED ---------------- */

  it("rejects user not part of request", async () => {
    // create random user
    const stranger = await prisma.user.create({
      data: {
        email: "stranger@test.com",
        passwordHash: "123",
        role: Role.USER,
      },
    });

    const strangerToken = makeToken(stranger.id, Role.USER);

    const res = await request(app)
      .post(`/api/message/${requestId}/messages`)
      .set("Authorization", `Bearer ${strangerToken}`)
      .send({ content: "hack" })
      .expect(403);

    expect(res.body.message).toMatch(/Unauthorized/);
  });

  it("blocks missing token", async () => {
    await request(app)
      .post(`/api/message/${requestId}/messages`)
      .send({ content: "hello" })
      .expect(401);
  });
});
