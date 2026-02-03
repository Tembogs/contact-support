import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { registerSchema, loginSchema } from "./auth.types";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const data = registerSchema.parse(req.body);
      const result = await AuthService.register(data.email, data.password, data.role);
      res.status(201).json(result);
      
    } catch (err: any) {
      console.error("❌ REGISTRATION ERROR:", err);
      res.status(400).json({ 
        message: err.message || "An error occurred during registration" 
      });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data.email, data.password, data.role);
      res.status(200).json(result);
    } catch (err: any) {
      console.error("❌ LOGIN ERROR:", err);
      res.status(400).json({ 
        message: err.message || "Invalid credentials" 
      });
    }
  }
}