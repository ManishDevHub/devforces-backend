import { Router , Response} from "express";
import { getProfile, getUserCalendar,  login, register, updateProfile } from "../controllers/user.controller"
import { validate } from "../middlewares/validate";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "../validations/auth.schema";
import { auth} from '../middlewares/auth'
import { isUser } from "../middlewares/user";
import { isAdmin } from "../middlewares/admin";

import { AuthRequest } from "../middlewares/auth";
import { forgotPassword } from "../controllers/forgotPassword.controller";
import { resetPassword } from "../controllers/resetPassword.controller";
import upload from "../middlewares/upload";
import { getAllProblems } from "../controllers/problem.controller";



 export const router = Router();
router.post('/register' , validate(registerSchema), register);
router.post('/login' , validate(loginSchema), login)
router.post('/forgot-password',validate(forgotPasswordSchema) , forgotPassword)
router.post("/reset-passwordPage/:token", validate(resetPasswordSchema), resetPassword);


router.get("/profile", auth, isUser, getProfile);
router.put("/updateProfile", auth , isUser,upload.single("avatar"), updateProfile);
router.get('/celender', auth , getUserCalendar);
  






export default router;
