import { MessageService } from "../messages/messages.services.js";
export class MessageController {
    static async send(req, res) {
        try {
            const { requestId } = req.params;
            const { content } = req.body;
            const message = await MessageService.sendMessage(requestId, req.user.userId, content);
            res.status(201).json(message);
        }
        catch (error) {
            res.status(403).json({ message: error.message });
        }
    }
    static async getHistory(req, res) {
        try {
            const { requestId } = req.params;
            const userId = req.user.userId;
            const history = await MessageService.getChatHistory(requestId, userId);
            res.json(history);
        }
        catch (error) {
            res.status(403).json({ error: error.message });
        }
    }
}
