import prisma from "../../config/prisma";
import { allowedTransitions } from "./request.state";
export class RequestService {
    static async createRequest(userId) {
        return prisma.supportRequest.create({
            data: {
                userId,
                status: "REQUESTED"
            }
        });
    }
    static async transitionRequest(requestedId, userId, role, nextStatus) {
        return prisma.$transaction(async (txt) => {
            const request = await txt.supportRequest.findUnique({
                where: { id: requestedId },
                include: { user: { select: { email: true, name: true } } }
            });
            if (!request)
                throw new Error("Request not found");
            if (role === 'USER' && request.userId !== userId) {
                throw new Error("You do not own this request");
            }
            // 2. If an Expert is trying to transition, they must be the ASSIGNED expert
            if (role === 'EXPERT' && request.expertId !== userId) {
                throw new Error("You are not assigned to this request");
            }
            // validating status
            const allowed = allowedTransitions[request.status];
            if (!allowed.includes(nextStatus)) {
                throw new Error(`Invalid status from ${request.status} to ${nextStatus}`);
            }
            // rules regarding roles
            if (nextStatus === "ACCEPTED" && role !== "EXPERT") {
                throw new Error("Only experts can accept requests");
            }
            if (nextStatus === "CLOSED" && !["USER", "EXPERT"].includes(role)) {
                throw new Error("Unauthorised to close request");
            }
            const updatedRequest = await txt.supportRequest.update({
                where: { id: requestedId },
                data: {
                    status: nextStatus,
                    expertId: nextStatus === "ACCEPTED"
                        ? userId
                        : request.expertId,
                    acceptedAt: nextStatus === "ACCEPTED"
                        ? new Date()
                        : request.acceptedAt,
                    closedAt: nextStatus === 'CLOSED'
                        ? new Date()
                        : request.closedAt
                }
            });
            // making the expert available after chat closed
            if (nextStatus === "CLOSED" && request?.expertId) {
                await txt.expertProfile.update({
                    where: { userId: request.expertId },
                    data: { isAvailable: true }
                });
            }
            return updatedRequest;
        });
    }
    // expert seeing request
    static async getOpenRequests() {
        return prisma.supportRequest.findMany({
            where: {
                status: "REQUESTED",
                expertId: null
            },
            include: {
                user: { select: { email: true } }
            }
        });
    }
    static async acceptRequest(requestId, expertId) {
        return prisma.$transaction(async (tx) => {
            // 1. Check if the request is still available
            const request = await tx.supportRequest.findUnique({
                where: { id: requestId },
                include: { user: { select: { email: true, name: true } } }
            });
            if (!request || request.status !== "REQUESTED") {
                throw new Error("Request is no longer available");
            }
            // 2. Assign the expert and update status
            const updated = await tx.supportRequest.update({
                where: { id: requestId },
                data: {
                    status: "ACCEPTED",
                    expertId: expertId,
                    acceptedAt: new Date()
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            name: true
                        }
                    }
                }
            });
            // 3. Set the expert to "Busy"
            await tx.expertProfile.upsert({
                where: { userId: expertId },
                update: { isAvailable: false },
                create: {
                    userId: expertId,
                    isAvailable: false,
                    bio: "New Expert"
                }
            });
            return updated;
        });
    }
    static async rejectRequest(requestId) {
        return prisma.supportRequest.update({
            where: { id: requestId },
            data: { status: "CANCELLED" }
        });
    }
    static async closeRequest(requestId, expertId) {
        return prisma.$transaction(async (tx) => {
            const request = await tx.supportRequest.findUnique({
                where: { id: requestId }
            });
            if (!request || (request.status !== "ACCEPTED" && request.status !== "ACTIVE")) {
                throw new Error("Request cannot be closed");
            }
            // Update the request
            const updated = await tx.supportRequest.update({
                where: { id: requestId },
                data: {
                    status: "CLOSED",
                    closedAt: new Date()
                }
            });
            // Make the expert available again!
            await tx.expertProfile.update({
                where: { userId: expertId },
                data: { isAvailable: true }
            });
            return updated;
        });
    }
    static async getAcceptedRequests(userId, role) {
        return prisma.supportRequest.findMany({
            where: {
                status: "ACCEPTED",
                // If a userId is provided, filter by their role
                ...(userId && role === "USER" ? { userId } : {}),
                ...(userId && role === "EXPERT" ? { expertId: userId } : {}),
            },
            include: {
                user: { select: { email: true } },
                expert: { select: { email: true } },
            },
            orderBy: {
                acceptedAt: 'desc'
            }
        });
    }
    static async getClosedRequests(userId, role) {
        return prisma.supportRequest.findMany({
            where: {
                status: "CLOSED",
                // If a userId is provided, filter by their role
                ...(userId && role === "USER" ? { userId } : {}),
                ...(userId && role === "EXPERT" ? { expertId: userId } : {}),
            },
            include: {
                user: { select: { email: true } },
                expert: { select: { email: true } },
            },
            orderBy: {
                closedAt: 'desc'
            }
        });
    }
}
