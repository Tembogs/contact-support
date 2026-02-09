import cors from "cors";
import express from "express";
import authRoutes from "./modules/auth/auth.routes";
import adminRoutes from "./modules/admin/admin.routes";
import requestRoutes from "./modules/requests/request.route"
import messageRoute from "./modules/messages/messages.routes"
import reviewRoute from "./modules/reviews/review.routes"
import expertRoute from "./modules/profiles/profile.routes"

const app = express();

app.use(express.json());

const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://chatroom-xi-lac.vercel.app',
  process.env.FRONTEND_URL || 'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes)
app.use("/api/request", requestRoutes)
app.use("/api/message", messageRoute)
app.use("/api/review", reviewRoute)
app.use("/api/profile", expertRoute)

export default app;

