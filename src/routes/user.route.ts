import { Router , Response} from "express";
import { login, register } from "../controllers/user.controller"
import { validate } from "../middlewares/validate";
import { loginSchema, registerSchema } from "../validations/auth.schema";
import { auth} from '../middlewares/auth'
import { isUser } from "../middlewares/user";
import { isAdmin } from "../middlewares/admin";

import { AuthRequest } from "../middlewares/auth";


const router = Router();
router.post('/register' , validate(registerSchema), register);
router.post('/login' , validate(loginSchema), login)

router.get("/profile", auth, isUser, (req: AuthRequest, res: Response) => {
  res.json({ message: "User profile access", user: req.user });
});

router.get("/admin/dashboard", auth, isAdmin, (req: AuthRequest, res: Response) => {
  res.json({ message: "Admin dashboard access", user: req.user });
});



export default router;
