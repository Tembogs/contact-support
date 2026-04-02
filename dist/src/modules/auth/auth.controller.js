import { AuthService } from "./auth.service.js";
import { registerSchema, loginSchema } from "./auth.types.js";
export class AuthController {
    static async register(req, res) {
        try {
            const data = registerSchema.parse(req.body);
            const result = await AuthService.register(data.email, data.password, data.role);
            res.status(201).json(result);
        }
        catch (err) {
            console.error("❌ REGISTRATION ERROR:", err);
            res.status(400).json({
                message: err.message || "An error occurred during registration"
            });
        }
    }
    static async login(req, res) {
        try {
            const data = loginSchema.parse(req.body);
            const result = await AuthService.login(data.email, data.password, data.role);
            res.status(200).json(result);
        }
        catch (err) {
            console.error("❌ LOGIN ERROR:", err);
            res.status(400).json({
                message: err.message || "Invalid credentials"
            });
        }
    }
}
