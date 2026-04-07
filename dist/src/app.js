import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import authRoutes from "./modules/auth/auth.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import requestRoutes from "./modules/requests/request.route.js";
import messageRoute from "./modules/messages/messages.routes.js";
import reviewRoute from "./modules/reviews/review.routes.js";
import expertRoute from "./modules/profiles/profile.routes.js";
const app = express();
// 2. Use it before routes
app.use(cookieParser());
app.use(express.json());
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://chatroom-xi-lac.vercel.app',
    process.env.FRONTEND_URL
].filter(Boolean);
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/request", requestRoutes);
app.use("/api/message", messageRoute);
app.use("/api/review", reviewRoute);
app.use("/api/profile", expertRoute);
export default app;
