
import { Router } from "express";
import { auth } from "../middlewares/auth";
import { isAdmin } from "../middlewares/admin";
import { createProblem, deleteAllProblem, deleteById, getAllProblem, getProblemById, updateProblem } from "../controllers/admin/admin.problem.controller";

const createProbelmRoute = Router();

createProbelmRoute.post('/problem/createProblem', auth,isAdmin, createProblem);
createProbelmRoute.get('/problem/allProblem', auth , isAdmin, getAllProblem);
createProbelmRoute.get('/problem/:id', auth ,isAdmin, getProblemById);
createProbelmRoute.put('/problem/:id', auth ,isAdmin, updateProblem);
createProbelmRoute.delete('/problem/:id', auth, isAdmin, deleteById);
createProbelmRoute.delete('/problem/deleteAll', auth, isAdmin , deleteAllProblem);

export default createProbelmRoute;