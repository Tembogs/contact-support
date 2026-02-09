import request from "supertest";
import app from "../../../app"; // your Express app
import { prisma } from "../../../config/prisma";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET!;
jest.setTimeout(20000);

function generateToken(userId: string, role: Role) {
  return jwt.sign({ userId, role }, JWT_SECRET);
}

describe("AdminController", () => {
  let adminToken: string;
  let testRequestId: string;

  beforeAll(async () => {
    // Use upsert so we don't fail on unique email
    const admin = await prisma.user.upsert({
      where: { email: "admin@test.com" },
      update: {},
      create: { email: "admin@test.com", passwordHash: "hashed", role: Role.ADMIN, name: "admin" }
    });
    adminToken = generateToken(admin.id, Role.ADMIN);

    // Ensure there is at least one user and expert for requests
    const user = await prisma.user.upsert({
      where: { email: "user@test.com" },
      update: {},
      create: { email: "user@test.com", passwordHash: "hashed", role: Role.USER, name: "user" }
    });

    const expert = await prisma.user.upsert({
      where: { email: "expert@test.com" },
      update: {},
      create: { email: "expert@test.com", passwordHash: "hashed", role: Role.EXPERT, name: "expert" }
    });

    await prisma.expertProfile.upsert({
      where: { userId: expert.id },
      update: {},
      create: { userId: expert.id, bio: "Test Expert", isAvailable: true, rating: 5.0 }
    });

    // Create or ensure support request exists
    const requestEntry = await prisma.supportRequest.upsert({
      where: { id: "test-request-id" }, // static ID so it won't conflict
      update: {},
      create: { id: "test-request-id", userId: user.id, expertId: expert.id, status: "ACTIVE" }
    });

    testRequestId = requestEntry.id;
  });

  afterAll(async () => {
    // Optionally cleanup only test-created entries
    await prisma.supportRequest.deleteMany({ where: { id: "test-request-id" } });
    await prisma.$disconnect();
  });

  it("GET /api/admin/requests should return requests", async () => {
    const res = await request(app)
      .get("/api/admin/requests")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty("id");
    expect(res.body[0]).toHaveProperty("user");
    expect(res.body[0]).toHaveProperty("expert");
  });

  it("POST /api/admin/requets/:id/close should close a request", async () => {
    const res = await request(app)
      .post(`/api/admin/requets/${testRequestId}/close`) // match your route typo
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.status).toBe("CLOSED");
  });

  it("GET /api/admin/experts/stats should return expert stats", async () => {
    const res = await request(app)
      .get("/api/admin/experts/stats") // match your route
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.length).toBeGreaterThanOrEqual(1);
    expect(res.body[0]).toHaveProperty("expertId");
    expect(res.body[0]).toHaveProperty("email");
    expect(res.body[0]).toHaveProperty("available");
    expect(res.body[0]).toHaveProperty("rating");
    expect(res.body[0]).toHaveProperty("totalSessions");
  });

  it("POST /api/admin/promote should promote a user to EXPERT", async () => {
    const newUser = await prisma.user.upsert({
      where: { email: "promote@test.com" },
      update: { role: Role.USER },
      create: { email: "promote@test.com", passwordHash: "hashed", role: Role.USER, name: "newuser" }
    });

    const res = await request(app)
      .post("/api/admin/promote")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ userId: newUser.id })
      .expect(200);

    expect(res.body.user.role).toBe("EXPERT");
  });

  it("GET /api/admin/stats should return dashboard stats", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty("totalUsers");
    expect(res.body).toHaveProperty("totalRequests");
    expect(res.body).toHaveProperty("activeChats");
  });
});

