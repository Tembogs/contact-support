import prisma from "../../config/prisma.js";
import { Role } from "../../../generated/prisma/client";
import { Prisma } from "../../../generated/prisma/client";

export class AdminService {
  
  // Promote a User to an Expert and initialize their Profile
  static async promoteToExpert(userId: string) {
    return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      
      // 1. Update the User role
      const user = await tx.user.update({
        where: { id: userId },
        data: { role: Role.EXPERT }
      });

      // 2. Create the empty Expert Profile so they show up in searches
      await tx.expertProfile.upsert({
        where: { userId: userId },
        update: {},
        create: {
          userId: userId,
          bio: "New Expert - Bio pending update",
          isAvailable: true
        }
      });

      return user;
    });
  }

  // Get System Stats (Dashboard View)
  static async getSystemStats() {
    const [totalUsers, totalRequests, activeChats] = await Promise.all([
      prisma.user.count(),
      prisma.supportRequest.count(),
      prisma.supportRequest.count({ where: { status: "ACTIVE" } })
    ]);

    return { totalUsers, totalRequests, activeChats };
  }
}