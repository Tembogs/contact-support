import { Response } from "express";
import { AuthRequest } from "../../middlewares/auth.middleware";
import { MessageService } from "../messages/messages.services";

export class MessageController {
  static async send(req: AuthRequest, res: Response) {
    try {
      const { requestId} = req.params as { requestId: string };
      const { content } = req.body;
      
      const message = await MessageService.sendMessage(
        requestId,
        req.user!.userId,
        content,
        req.app.get("io")
      );
      
      res.status(201).json(message);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }


  static async getHistory(req: AuthRequest, res: Response) {
    try {
      const { requestId } = req.params as { requestId: string };
      const userId = req.user!.userId;

      const history = await MessageService.getChatHistory(requestId, userId);
      res.json(history);
    } catch (error: any) {
      res.status(403).json({ error: error.message });
    }
  }
}