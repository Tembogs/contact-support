import "dotenv/config";
import app from "./app";
import { createServer } from "http";
import { intheSocket } from "./socket";
export function createHttpServer() {
    const httpServer = createServer(app);
    const io = intheSocket(httpServer);
    app.set("io", io);
    // Return both so consumers can use io safely
    return { httpServer, io };
}
if (process.env.NODE_ENV !== "test") {
    const { httpServer } = createHttpServer();
    const PORT = process.env.PORT || 3001;
    httpServer.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
}
