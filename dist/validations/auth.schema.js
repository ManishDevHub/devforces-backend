"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    name: zod_1.z.string().min(3, "username atleast 3 charater").max(20, "username is to long"),
    email: zod_1.z.string().email("Invalid Email"),
    password: zod_1.z.string().min(6, "Password atleast 6 charater long").max(20, "Password is to long"),
    role: zod_1.z.enum(["USER", "ADMIN"]).optional()
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email"),
    password: zod_1.z.string().min(3).max(20)
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z.string().email()
});
exports.resetPasswordSchema = zod_1.z.object({
    password: zod_1.z.string().min(6, "Password is to small").max(20, "Password is to long")
});
