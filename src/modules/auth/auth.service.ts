import prisma from "../../config/prisma.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "supersecret" 

export class AuthService {
  static async register(
    email: string, 
    password: string, 
    role: "USER" | "EXPERT"
  ) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error("Email already in use");

  // Logic to extract name from email
  const defaultName = email.split('@')[0];

  const passwordHash = await bcrypt.hash(password, 10);
  
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      role,
      name: defaultName,
      expertProfile: role === "EXPERT" 
        ? {
          create: {
            bio: `Hello, I am ${defaultName}! Please update my bio.`, 
            isAvailable: true,
            rating: 0
          }
        } : undefined
    }
  });

  const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
  return { user, token };
}


  static async login(
    email: string,
    password: string,
    role: "USER" | "EXPERT" 
  ) {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) throw new Error("Invalid credentials");


    if (user.role !== role) {
      throw new Error(`Unauthorized: You are registered as a ${user.role}, not an ${role}`);
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) throw new Error("Invalid password");

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    
    const displayName = user.email.split('@')[0];

    return { 
      user: { id: user.id, email: user.email, role: user.role, name: displayName }, 
      token 
    };
  }

}