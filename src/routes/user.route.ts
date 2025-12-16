import { Router , Response} from "express";
import { login, register } from "../controllers/user.controller"
import { validate } from "../middlewares/validate";
import { forgotPasswordSchema, loginSchema, registerSchema, resetPasswordSchema } from "../validations/auth.schema";
import { auth} from '../middlewares/auth'
import { isUser } from "../middlewares/user";
import { isAdmin } from "../middlewares/admin";

import { AuthRequest } from "../middlewares/auth";
import { forgotPassword } from "../controllers/forgotPassword.controller";
import { resetPassword } from "../controllers/resetPassword.controller";



 export const router = Router();
router.post('/register' , validate(registerSchema), register);
router.post('/login' , validate(loginSchema), login)
router.post('/forgot-password',validate(forgotPasswordSchema) , forgotPassword)
router.post("/reset-passwordPage/:token", validate(resetPasswordSchema), resetPassword);

router.get("/profile", auth, isUser, (req: AuthRequest, res: Response) => {
  res.json({ message: "User profile access", user: req.user });
});

router.get("/admin/dashboard", auth, isAdmin, (req: AuthRequest, res: Response) => {
  res.json({ message: "Admin dashboard access", user: req.user });
});



export default router;
