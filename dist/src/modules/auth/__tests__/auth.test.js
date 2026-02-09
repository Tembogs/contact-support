import request from "supertest";
import app from "../../../app";
import prisma from "../../../config/prisma";
jest.setTimeout(20000);
describe("AuthController (E2E)", () => {
    const api = request(app);
    const testUserEmail = "user@test.com";
    const testExpertEmail = "expert@test.com";
    beforeAll(async () => {
        // Clean DB tables
        await prisma.message.deleteMany({});
        await prisma.review.deleteMany({});
        await prisma.session.deleteMany({});
        await prisma.supportRequest.deleteMany({});
        await prisma.skill.deleteMany({});
        await prisma.expertProfile.deleteMany({});
        await prisma.user.deleteMany({});
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    describe("POST /api/auth/register", () => {
        it("should register a USER successfully", async () => {
            const res = await api
                .post("/api/auth/register")
                .send({ email: testUserEmail, password: "Password123", role: "USER" })
                .expect(201);
            expect(res.body).toHaveProperty("token");
            expect(res.body.user).toMatchObject({ email: testUserEmail, role: "USER" });
        });
        it("should register an EXPERT successfully", async () => {
            const res = await api
                .post("/api/auth/register")
                .send({ email: testExpertEmail, password: "ExpertPass123", role: "EXPERT" })
                .expect(201);
            expect(res.body).toHaveProperty("token");
            expect(res.body.user).toMatchObject({ email: testExpertEmail, role: "EXPERT" });
            // Make sure expertProfile is created
            const profile = await prisma.expertProfile.findUnique({ where: { userId: res.body.user.id } });
            expect(profile).not.toBeNull();
        });
        it("should fail to register with duplicate email", async () => {
            const res = await api
                .post("/api/auth/register")
                .send({ email: testUserEmail, password: "Password123", role: "USER" })
                .expect(400);
            expect(res.body.message).toMatch(/email already in use/i);
        });
    });
    describe("POST /api/auth/login", () => {
        it("should login USER successfully", async () => {
            const res = await api
                .post("/api/auth/login")
                .send({ email: testUserEmail, password: "Password123", role: "USER" })
                .expect(200);
            expect(res.body).toHaveProperty("token");
            expect(res.body.user).toMatchObject({ email: testUserEmail, role: "USER" });
        });
        it("should login EXPERT successfully", async () => {
            const res = await api
                .post("/api/auth/login")
                .send({ email: testExpertEmail, password: "ExpertPass123", role: "EXPERT" })
                .expect(200);
            expect(res.body).toHaveProperty("token");
            expect(res.body.user).toMatchObject({ email: testExpertEmail, role: "EXPERT" });
        });
        it("should fail login with wrong password", async () => {
            const res = await api
                .post("/api/auth/login")
                .send({ email: testUserEmail, password: "WrongPass", role: "USER" })
                .expect(400);
            expect(res.body.message).toMatch(/invalid password/i);
        });
        it("should fail login with wrong role", async () => {
            const res = await api
                .post("/api/auth/login")
                .send({ email: testUserEmail, password: "Password123", role: "EXPERT" })
                .expect(400);
            expect(res.body.message).toMatch(/unauthorized/i);
        });
        it("should fail login with unregistered email", async () => {
            const res = await api
                .post("/api/auth/login")
                .send({ email: "unknown@test.com", password: "Password123", role: "USER" })
                .expect(400);
            expect(res.body.message).toMatch(/invalid credentials/i);
        });
    });
});
