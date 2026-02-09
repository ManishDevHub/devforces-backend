import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { any } from "zod";
import { de } from "zod/v4/locales";

const JWT_SECRET = process.env.JWT_SECRET || "sdklfhdfjdsfd";

export interface AuthRequest extends Request {
  user?: any;
}

export const auth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = header.split(" ")[1];

    // 🔒 HARD STOP
    if (!token || token === "undefined" || token === "null") {
      return res.status(401).json({ message: "Invalid token" });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};