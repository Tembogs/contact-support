import prisma from "../../config/prisma";
export class MessageService {
    static async sendMessage(requestId, senderId, content, io) {
        //  Verify the request exists and the sender is the User or the assigned Expert
        const request = await prisma.supportRequest.findUnique({
            where: { id: requestId },
        });
        if (!request)
            throw new Error("Support request not found");
        if (request.userId !== senderId && request.expertId !== senderId) {
            throw new Error("Unauthorized: You are not part of this session");
        }
        if (request.status === "CLOSED") {
            throw new Error("Cannot send messages to a closed request");
        }
        //  Create the message
        const message = await prisma.message.create({
            data: {
                requestId,
                senderId,
                content,
            },
            include: {
                sender: { select: { email: true, role: true } }
            }
        });
        io.to(requestId).emit("new-message", message);
        return message;
    }
    static async getChatHistory(requestId, userId) {
        // 1. Security Check: Is the person asking actually part of this chat?
        const request = await prisma.supportRequest.findUnique({
            where: { id: requestId }
        });
        if (!request)
            throw new Error("Chat not found");
        if (request.userId !== userId && request.expertId !== userId) {
            throw new Error("Unauthorized access to these messages");
        }
        // 2. Fetch the messages
        return await prisma.message.findMany({
            where: { requestId },
            orderBy: { createdAt: 'asc' },
            include: {
                sender: {
                    select: {
                        id: true,
                        email: true,
                        role: true
                    }
                }
            }
        });
    }
}
