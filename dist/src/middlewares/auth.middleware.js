import jwt from "jsonwebtoken";
const JWT_SECRET = process.env.JWT_SECRET;
export const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader)
            return res.status(401).json({ message: "Not Authorized" });
        const token = authHeader.split(' ')[1];
        if (!token)
            return res.status(401).json({ message: "Token missing" });
        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;
            console.log("--- AUTH DEBUG ---");
            console.log("User Role in Token:", decoded.role);
            console.log("Required Roles for Route:", roles);
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
