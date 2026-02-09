import {Response} from "express";
import { RequestService } from "./request.service";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { MatchingService } from "../matching/matching.service";
import prisma from "../../config/prisma";

export class RequestController {
  static async create(req: AuthRequest, res:Response){
    try {
      const request = await RequestService.createRequest (req.user!.userId);
      const io = req.app.get("io");
    try {
        const assignedRequest = await MatchingService.assignExpertToRequest(request.id);
        
        // 1. Fetch the FULL data so the frontend has emails
        const fullRequest = await prisma.supportRequest.findUnique({
          where: { id: assignedRequest.id },
          include: {
            user: { select: { email: true } },
            expert: { select: { email: true } }
          }
        });

        if (fullRequest && io) {
          // Send to the User's personal room
          io.to(`user_${fullRequest.userId}`).emit("request-accepted", fullRequest);
          
          // Send to the Expert's personal room
          io.to(`user_${fullRequest.expertId}`).emit("new-assignment", fullRequest);
        }

        return res.status(201).json(fullRequest);
      } catch (Matcherror) {
      // If no expert was automatically assigned, it becomes a general pending request
      const io = req.app.get("io");
      if (io) {
        // Fetch with user info so experts see the email in the card
        const pendingReq = await prisma.supportRequest.findUnique({
          where: { id: request.id },
          include: { user: { select: { email: true } } }
        });
        // Broadcast to all experts that a new card should appear in their grid
        io.emit("new-pending-request", pendingReq);
          }
          return res.status(201).json(request);
        }
       } catch (error: any) {
        return res.status(500).json({message: error.message}) 
        }
      
      }

  static async transition(req: AuthRequest, res:Response){
    const id = req.params.id as string;
    const { status } = req.body;

    const updated = await RequestService.transitionRequest(
      id,
      req.user!.userId,
      req.user!.role as "USER" | "EXPERT",
      status
    )
    res.json(updated)
  }

  // expert getting requests
  static async getPending(req: AuthRequest, res: Response) {
  const requests = await RequestService.getOpenRequests();
  res.json(requests);
}

static async accept(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    // 1. Update the request
    const updated = await RequestService.acceptRequest(id, req.user!.userId);

    // 2. FETCH FULL DATA for the socket (Critical Step)
    const fullRequest = await prisma.supportRequest.findUnique({
      where: { id: updated.id },
      include: {
        user: { select: { email: true, name: true } },
        expert: { select: { email: true, name: true } }
      }
    });

    const io = req.app.get("io");
    if (io && fullRequest) {
      // 📣 Emit the FULL request so the frontend has the email immediately
      io.emit("request-accepted-by-other", { id });
      io.to(`user_${fullRequest.userId}`).emit("request-accepted", fullRequest);
      io.to(`user_${fullRequest.expertId}`).emit("new-assignment", fullRequest);
    }
    
    res.json(fullRequest); // Return the full one to the expert who clicked
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}

static async close(req: AuthRequest, res: Response) {
  try {
    const id = req.params.id as string;
    
    // 1. Your existing service call
    const updated = await RequestService.closeRequest(id, req.user!.userId);

    // 2. Get the socket instance from the app
    const io = req.app.get("io"); 

    if (io) {
      io.to(id).emit("session-closed", {
        requestId: id,
        status: "CLOSED"
      });
    }

    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
}
static async reject(req: AuthRequest, res: Response) {
  const id = req.params.id as string;
  const updated = await RequestService.rejectRequest(id);
  res.json(updated);
}

// getting accepted request
static async getAccepted(req: AuthRequest, res: Response) {
    try {
      const requests = await RequestService.getAcceptedRequests(
        req.user!.userId,
        req.user!.role
      );
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async getClosed(req: AuthRequest, res: Response) {
    try {
      const requests = await RequestService.getClosedRequests(
        req.user!.userId,
        req.user!.role
      );
      res.json(requests);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  }

  static async cancel(req: AuthRequest, res: Response) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.userId;

      // 1. Update status in DB via your Service
      const updated = await RequestService.transitionRequest(
        id,
        userId,
        "USER",
        "CANCELLED"
      );

      // 2. Get the socket instance
      const io = req.app.get("io");
      if (io) {
        // so the request disappears from all expert dashboards
        io.emit("request-cancelled", { id });
        // Also notify the specific chat room in case someone was looking at it
        io.to(id).emit("status-updated", { id, status: "CANCELLED" });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}