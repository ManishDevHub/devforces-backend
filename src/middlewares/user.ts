
import { Response , NextFunction } from "express";
import { AuthRequest } from "./auth";

export const isUser = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== "USER" && req.user?.role !== "ADMIN") {
        return res.status(403).json({ message: "Access denied: Authenticated users only" });
    }
    next();
};