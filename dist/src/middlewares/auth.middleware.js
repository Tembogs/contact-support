import { verifyToken } from "./jwt";
export const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            return res.status(401).json({ message: "Not Authorized" });
        const token = authHeader.split(' ')[1];
        if (!token)
            return res.status(401).json({ message: "Token missing" });
        try {
            const decoded = verifyToken(token);
            req.user = decoded;
            if (roles.length && !roles.includes(decoded.role)) {
                return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
            }
            next();
        }
        catch (error) {
            return res.status(401).json({ message: "Invalid or expired token" });
        }
    };
};
