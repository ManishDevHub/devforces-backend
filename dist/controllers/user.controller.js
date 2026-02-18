"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserCalendar = exports.updateProfile = exports.getProfile = exports.login = exports.register = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const cloudinaryUpload_1 = require("../utils/cloudinaryUpload");
const cloudinary_1 = __importDefault(require("../config/cloudinary"));
const JWT_SECRET = process.env.JWT_SECRET || "sdddsdsgsgsgs";
const generateToken = (id, role) => {
    return jsonwebtoken_1.default.sign({ id, role }, JWT_SECRET, { expiresIn: "7d" });
};
const register = async (req, res) => {
    const { name, email, password, role } = req.body;
    const existingUser = await prisma_1.default.user.findUnique({
        where: { email }
    });
    if (existingUser) {
        return res.status(400).json({
            message: " Email alrady exists"
        });
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 12);
    const user = await prisma_1.default.user.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role: role || "USER",
            resetToken: ""
        }
    });
    res.status(200).json({
        message: " Register Successfully", user: {
            id: user.id,
            email: user.email,
        },
    });
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await prisma_1.default.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({ mess: "Invalid email or Password" });
        }
        const isMatch = await bcrypt_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or Password" });
        }
        const token = generateToken(user.id, user.role);
        res.status(200).json({
            message: " Login successfully",
            token,
            user: {
                name: user.name,
                id: user.id,
                email: user.email,
                role: user.role
            }
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Server error" });
    }
};
exports.login = login;
const getProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                bio: true,
                createdAt: true,
            }
        });
        if (!user) {
            return res.status(400).json({ message: " User not found" });
        }
        res.json(user);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Failed to load profile" });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const name = typeof req.body.name === "string" ? req.body.name.trim() : undefined;
        const bio = typeof req.body.bio === "string" ? req.body.bio.trim() : undefined;
        const existingUser = await prisma_1.default.user.findUnique({
            where: { id: userId },
            select: { avatarPublicId: true },
        });
        if (!existingUser) {
            return res.status(404).json({ message: "User not found" });
        }
        let avatarUpdate;
        if (req.file) {
            if (existingUser.avatarPublicId) {
                await cloudinary_1.default.uploader.destroy(existingUser.avatarPublicId);
            }
            const uploaded = await (0, cloudinaryUpload_1.uploadCloToBinary)(req.file.buffer, "user_avatars", `user_${userId}`);
            avatarUpdate = {
                avatar: uploaded.url,
                avatarPublicId: uploaded.publicId,
            };
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id: userId },
            data: {
                ...(name !== undefined ? { name } : {}),
                ...(bio !== undefined ? { bio } : {}),
                ...(avatarUpdate || {}),
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                bio: true,
                createdAt: true,
            },
        });
        return res.json({
            message: "Profile updated successfully!",
            user: updatedUser,
        });
    }
    catch (error) {
        console.error("UPDATE PROFILE ERROR:", error);
        return res.status(500).json({ message: "Failed to update profile" });
    }
};
exports.updateProfile = updateProfile;
const getUserCalendar = async (req, res) => {
    try {
        const userId = req.user.id;
        const activity = await prisma_1.default.activity.findMany({
            where: { userId },
            orderBy: { date: "asc" },
            select: {
                date: true,
                count: true,
            }
        });
        if (!activity) {
            return res.status(404).json({ message: " Something went wrong" });
        }
        res.json(activity);
    }
    catch (error) {
        console.error(" Celender error", error);
        res.status(500).json({ message: " Server error" });
    }
};
exports.getUserCalendar = getUserCalendar;
