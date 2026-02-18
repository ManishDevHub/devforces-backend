"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.forgotPassword = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = __importDefault(require("crypto"));
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(404).json({ error: "User not found with this email" });
        }
        const resetToken = crypto_1.default.randomBytes(32).toString("hex");
        const expireTime = new Date(Date.now() + 15 * 60 * 1000);
        await prisma_1.default.user.update({
            where: { email },
            data: {
                resetToken,
                resetTokenExpires: expireTime,
            },
        });
        const resetLink = `http://localhost:3000/reset-passwordPage/${resetToken}`;
        const transporter = nodemailer_1.default.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });
        const message = {
            from: `"Devforces Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "Reset your Devforces Password",
            html: `
        <h2>Password Reset Request</h2>
        <p>Click the link below to reset your password:</p>
        <p>
          <a href="${resetLink}" style="color:#1a73e8; text-decoration:underline; font-size:16px;">
             Reset your password
          </a>
        </p>
        <p>This link will expire in 15 minutes.</p>
      `,
        };
        await transporter.sendMail(message);
        return res.status(200).json({
            message: "Password reset link sent successfully",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Server error while sending email" });
    }
};
exports.forgotPassword = forgotPassword;
