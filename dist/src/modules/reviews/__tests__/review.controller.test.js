import request from "supertest";
import express from "express";
import prisma from "../../../config/prisma";
import reviewRoutes from "../review.routes";
import jwt from "jsonwebtoken";
import { Role, RequestStatus } from "@prisma/client";
const JWT_SECRET = process.env.JWT_SECRET;
const app = express();
app.use(express.json());
app.use("/api/review", reviewRoutes);
describe("ReviewController", () => {
    let userId;
    let expertId;
    let requestId;
    let userToken;
    let expertToken;
    beforeAll(async () => {
        await prisma.review.deleteMany({});
        await prisma.supportRequest.deleteMany({});
        await prisma.expertProfile.deleteMany({});
        await prisma.user.deleteMany({});
        const user = await prisma.user.create({
            data: {
                email: "ctrl-user@test.com",
                passwordHash: "123",
                role: Role.USER,
            },
        });
        userId = user.id;
        const expert = await prisma.user.create({
            data: {
                email: "ctrl-expert@test.com",
                passwordHash: "123",
                role: Role.EXPERT,
            },
        });
        expertId = expert.id;
        await prisma.expertProfile.create({
            data: {
                userId: expertId,
                bio: "Bio",
                rating: 0,
            },
        });
        const req = await prisma.supportRequest.create({
            data: {
                userId,
                expertId,
                status: RequestStatus.CLOSED,
            },
        });
        requestId = req.id;
        userToken = jwt.sign({ userId, role: "USER" }, JWT_SECRET);
        expertToken = jwt.sign({ userId: expertId, role: "EXPERT" }, JWT_SECRET);
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    it("POST /api/review creates review", async () => {
        const res = await request(app)
            .post("/api/review")
            .set("Authorization", `Bearer ${userToken}`)
            .send({
            requestId,
            rating: 5,
            comment: "Excellent",
        })
            .expect(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.rating).toBe(5);
    });
    it("GET /api/review/expert/:expertId returns reviews", async () => {
        const res = await request(app)
            .get(`/api/review/expert/${expertId}`)
            .set("Authorization", `Bearer ${expertToken}`)
            .expect(200);
        expect(res.body.meta).toBeDefined();
        expect(res.body.data.length).toBeGreaterThan(0);
    });
});
