
import { Router } from "express";
import { auth } from "../middlewares/auth";
import { isAdmin } from "../middlewares/admin";
import { createProblem, deleteAllProblem, deleteById, getAllProblem, getProblemById, updateProblem } from "../controllers/admin/admin.problem.controller";

const createProbelmRoute = Router();

createProbelmRoute.post('/createProbelm', auth, isAdmin, createProblem);
createProbelmRoute.get('/allProblem', auth , isAdmin, getAllProblem);
createProbelmRoute.get('/:id', auth ,isAdmin, getProblemById);
createProbelmRoute.put('/:id', auth ,isAdmin, updateProblem);
createProbelmRoute.delete('/:id', auth, isAdmin, deleteById);
createProbelmRoute.delete('/', auth, isAdmin , deleteAllProblem);

export default createProbelmRoute;