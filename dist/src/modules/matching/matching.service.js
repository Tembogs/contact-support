import prisma from "../../config/prisma";
import { RequestStatus, Role } from "@prisma/client";
export class MatchingService {
    // getting available expert
    static async findavailableExpert() {
        return prisma.expertProfile.findFirst({
            where: { isAvailable: true,
                user: {
                    role: Role.EXPERT,
                    isOnline: true
                }
            },
            orderBy: {
                rating: "desc"
            },
            include: { user: true },
        });
    }
    // getting available expert to chat request
    static async assignExpertToRequest(requestId) {
        return prisma.$transaction(async (tx) => {
            const expert = await tx.expertProfile.findFirst({
                where: {
                    isAvailable: true,
                    user: { isOnline: true }
                },
                include: { user: true }
            });
            if (!expert) {
                throw new Error("No expert available");
            }
            // assigning expert and locking the assignment
            const request = await tx.supportRequest.update({
                where: { id: requestId },
                data: {
                    expertId: expert.userId,
                    status: RequestStatus.ACCEPTED,
                    acceptedAt: new Date()
                },
                include: {
                    user: { select: { email: true } },
                    expert: { select: { email: true } }
                }
            });
            await tx.expertProfile.update({
                where: { id: expert.id },
                data: { isAvailable: false }
            });
            return request;
        });
    }
}
