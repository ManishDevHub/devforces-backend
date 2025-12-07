import {Router} from 'express'

import { RegisterUser } from '../controllers/auth.controller';

const router = Router();

router.post('/register', RegisterUser)


export default router;