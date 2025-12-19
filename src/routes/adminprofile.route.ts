 import { Router } from "express";
import { isAdmin } from "../middlewares/admin";
import { auth } from "../middlewares/auth";
import upload from "../middlewares/upload";
import { getProfile, login, updateProfile } from "../controllers/user.controller";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "../validations/auth.schema";
import { resetPassword } from "../controllers/resetPassword.controller";
import { validate } from "../middlewares/validate";
import { forgotPassword } from "../controllers/forgotPassword.controller";
import { register } from "../controllers/user.controller";


 
const AdminRouter = Router();
AdminRouter.post('/register' , validate(registerSchema), register);
AdminRouter.post('/login' , validate(loginSchema), login)
AdminRouter.post('/forgot-password',validate(forgotPasswordSchema) , forgotPassword)
AdminRouter.post("/reset-passwordPage/:token", validate(resetPasswordSchema), resetPassword);


AdminRouter.get("/profile", auth, isAdmin, getProfile);
AdminRouter.put("/updateProfile", auth , isAdmin,upload.single("avatar"), updateProfile);

export default AdminRouter;

