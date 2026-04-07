import { AuthService } from "./auth.service.js";
import { registerSchema } from "./auth.types.js";
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
            const { email, password, role } = req.body;
            const { user, token } = await AuthService.login(email, password, role);
            // Set the cookie
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
            });
            return res.json({ user });
        }
        catch (error) {
            return res.status(401).json({ message: error.message });
        }
    }
    ;
    static async logout(req, res) {
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/'
        });
        return res.status(200).json({ message: "Logged out successfully" });
    }
    ;
}
