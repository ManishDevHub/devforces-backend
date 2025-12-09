import { Router } from "express";
import { login, register } from "../controllers/user.controller"
import { validate } from "../middlewares/validate";
import { loginSchema, registerSchema } from "../validations/auth.schema";
import { auth} from '../middlewares/auth'


const router = Router();
router.post('/register' , validate(registerSchema), register);
router.post('/login' , validate(loginSchema), login)


export default router;
