import prisma from "../../../config/prisma";
import { MessageService } from "../messages.services";
import { Role, RequestStatus } from "@prisma/client";
// Mock Socket.io server
const ioMock = {
    to: () => ({
        emit: jest.fn(),
    }),
};
describe("MessageService", () => {
    let userId;
    let expertId;
    let requestId;
    beforeAll(async () => {
        // Clean relevant tables
        await prisma.message.deleteMany({});
        await prisma.review.deleteMany({});
        await prisma.session.deleteMany({});
        await prisma.supportRequest.deleteMany({});
        await prisma.skill.deleteMany({});
        await prisma.expertProfile.deleteMany({});
        await prisma.user.deleteMany({});
        // Create a user and expert
        const user = await prisma.user.create({
            data: { email: "user@test.com", passwordHash: "123", role: Role.USER },
        });
        userId = user.id;
        const expert = await prisma.user.create({
            data: { email: "expert@test.com", passwordHash: "123", role: Role.EXPERT },
        });
        expertId = expert.id;
        // Expert profile
        await prisma.expertProfile.create({
            data: { userId: expertId, bio: "Expert Bio", isAvailable: true, rating: 5 },
        });
        // Create a support request
        const request = await prisma.supportRequest.create({
            data: { userId, expertId, status: RequestStatus.ACTIVE },
        });
        requestId = request.id;
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    beforeEach(async () => {
        await prisma.message.deleteMany({});
    });
    it("sendMessage should create a message and emit via io", async () => {
        const message = await MessageService.sendMessage(requestId, userId, "Hello World", ioMock);
        expect(message).toBeDefined();
        expect(message.content).toBe("Hello World");
        expect(message.senderId).toBe(userId);
    });
    it("getChatHistory should fetch messages in ascending order", async () => {
        // Send multiple messages
        await MessageService.sendMessage(requestId, userId, "first", ioMock);
        await MessageService.sendMessage(requestId, expertId, "second", ioMock);
        await MessageService.sendMessage(requestId, userId, "third", ioMock);
        const history = await MessageService.getChatHistory(requestId, userId);
        expect(history).toHaveLength(3);
        expect(history[0].content).toBe("first");
        expect(history[1].content).toBe("second");
        expect(history[2].content).toBe("third");
    });
    it("should prevent unauthorized user from sending message", async () => {
        await expect(MessageService.sendMessage(requestId, "fakeUserId", "hack", ioMock)).rejects.toThrow("Unauthorized");
    });
});
