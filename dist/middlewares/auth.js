"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "sdklfhdfjdsfd";
const auth = (req, res, next) => {
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
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error("Auth error:", error);
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};
exports.auth = auth;
