import { z } from "zod";
export const registerSchema = z.object({
    email: z.email(),
    password: z.string().min(6),
    role: z.enum(["USER", "EXPERT"])
});
export const loginSchema = z.object({
    email: z.email(),
    password: z.string(),
    role: z.enum(['USER', 'EXPERT']),
});
