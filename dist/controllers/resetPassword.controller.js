"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const prisma_1 = __importDefault(require("../config/prisma"));
const resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;
        console.log("Token from params:", token);
        console.log("Password from body:", password);
        if (!token || !password) {
            return res.status(400).json({
                message: "Token and password are required",
            });
        }
        const user = await prisma_1.default.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpires: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            return res.status(400).json({
                error: "Invalid or expired reset token",
            });
        }
        const hasedPassword = await bcrypt_1.default.hash(password, 12);
        await prisma_1.default.user.update({
            where: { id: user.id },
            data: {
                password: hasedPassword,
                resetToken: null,
                resetTokenExpires: null,
            },
        });
        return res.status(200).json({
            message: "Password reset successfully",
        });
    }
    catch (error) {
        console.error("Reset password error: ", error);
        return res
            .status(500)
            .json({ error: "Server error while resetting password" });
    }
};
exports.resetPassword = resetPassword;
