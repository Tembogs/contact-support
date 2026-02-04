import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware.js";
import { RequestStatus } from "../../../generated/prisma/client.js";
import prisma from "../../config/prisma.js";
import { AdminService } from "./admin.services.js";

export class AdminController {
  
  // having access to request
  static async listRequests(req: AuthRequest, res: Response) {
    const {status, userId, expertId} = req.query

    const requests = await prisma.supportRequest.findMany ({
      where: {
        ...(status && {status: status as RequestStatus}),
        ...(userId && {userId: userId as string}),
        ...(expertId && {expertId: expertId as string})},
      
      include: {
        user: true,
        expert: true,
        messages:true},

      orderBy:{createdAt: "desc"}  
    });
    res.json(requests)
  }

  // can force-close a request
  static async closeRequests(req: AuthRequest, res: Response){
    const {id} = req.params;

    const request = await prisma.supportRequest.update({
      where: {id: String(id)},
      data: {
        status: RequestStatus.CLOSED,
        closedAt: new Date()
      }
    })

    // can release expert if choosen
    if(request.expertId){
      await prisma.expertProfile.update({
        where: { userId: request.expertId},
        data:{isAvailable: true}
      })
    }
      res.json(request);
  }

  // see all the expert stats
    static async expertStats(req: AuthRequest, res: Response) {
  try {
    const stats: any[] = await prisma.expertProfile.findMany({
      include: {
        user: {
          select: {
            email: true,
            _count: {
              select: { assigned: true }
            }
          }
        }
      }
    });

    const result = stats.map((expert: any) => ({
      expertId: expert.userId,
      email: expert.user.email,
      totalSessions: expert.user._count.assigned, 
      available: expert.isAvailable,
      rating: expert.rating
    }));

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
}

    static async promote(req: AuthRequest, res: Response) {
    try {
      const { userId } = req.body;
      const updatedUser = await AdminService.promoteToExpert(userId);
      res.json({ message: "User promoted to EXPERT successfully", user: updatedUser });
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  static async getDashboard(req: AuthRequest, res: Response) {
    try {
      const stats = await AdminService.getSystemStats();
      res.json(stats);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }
}