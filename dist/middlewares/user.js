"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isUser = void 0;
const isUser = (req, res, next) => {
    if (req.user?.role !== "USER") {
        return res.status(403).json({ message: "Access denied: USER only" });
    }
    next();
};
exports.isUser = isUser;
