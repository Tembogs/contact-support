import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { verifyToken } from "./middlewares/jwt";
import prisma from "./config/prisma";
import  {MessageService}  from "./modules/messages/messages.services"; 

export function intheSocket(server: HttpServer): SocketServer {
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://chatroom-xi-lac.vercel.app',
    process.env.FRONTEND_URL || 'http://localhost:3000'
  ];

  const io = new SocketServer(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
      methods: ["GET", "POST"],
      credentials: true
    },
    allowEIO3: true
  });

 

  // 1. Authentication Middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Unauthorized"));

      const payload = verifyToken(token);
      socket.data.user = payload;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  

  // 2. Main Connection Handler
  io.on("connection", async (socket) => {
    const userId = socket.data.user.userId as string;
    console.log('✅ Socket connected:', userId);
    socket.join(`user_${userId}`);

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log('findUnique result:', existingUser);

    // Set user to Online in DB
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: true }
      });
    } catch (error: any) {
      console.error('Error updating user online status:', {
        message: error?.message,
        code: error?.code,
        meta: error?.meta,
        fullError: error
      });
    }

    // A. JOIN ROOM LOGIC
    socket.on("join-request", async (requestId: string) => {
      const request = await prisma.supportRequest.findUnique({
        where: { id: requestId }
      });

      if (!request) {
        return socket.emit("error", "Request not found");
      }

      // Security: Only allow the client or the assigned expert into the room
      if (request.userId !== userId && request.expertId !== userId) {
        return socket.emit("error", "Access Denied");
      }

      socket.join(requestId);
      console.log(`👤 User ${userId} joined room: ${requestId}`);
    });

    // B. SEND MESSAGE LOGIC
    socket.on("Send-message", async ({ requestId, content }: { requestId: string; content: string }) => {
      try {
        
        await MessageService.sendMessage( requestId, userId, content, io);
      } catch (err: any) {
        socket.emit("error", err.message);
      }
    });

    // C. DISCONNECT LOGIC
    socket.on("disconnect", async () => {
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { isOnline: false }
        });
      } catch (error: any) {
        console.error('Error updating user offline status:', {
          message: error?.message,
          code: error?.code,
          meta: error?.meta,
          fullError: error
        });
      }
      console.log("❌ Socket disconnected:", userId);
    });
  });
  
  // MessageService(io);
  return io;
}