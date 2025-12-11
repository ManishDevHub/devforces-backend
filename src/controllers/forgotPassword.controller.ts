import prisma from "../config/prisma";
import nodemailer from "nodemailer";
import { Request, Response } from "express";
import crypto from "crypto";

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({ error: "User not found with this email" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");

    const expireTime = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpires: expireTime,
      },
    });

    const resetLink = `http://localhost:3000/reset-passwordPage/${resetToken}`;

    const transporter = nodemailer.createTransport({
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
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Server error while sending email" });
  }
};
