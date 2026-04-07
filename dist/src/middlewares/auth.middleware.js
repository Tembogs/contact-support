import { verifyToken } from "./jwt.js";
export const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        // 1. Get the token from cookies instead of headers
        const token = req.cookies?.token;
        if (!token) {
            return res.status(401).json({ message: "Not Authorized: No token provided" });
        }
        try {
            // 2. Verify the token
            const decoded = verifyToken(token);
            req.user = decoded;
            // 3. Check Permissions
            if (roles.length > 0 && !roles.includes(decoded.role)) {
                return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
            }
            next();
        }
        catch (error) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
    };
};
