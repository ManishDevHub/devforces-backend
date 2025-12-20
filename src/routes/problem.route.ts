
import { Router } from "express";
import { getAllProblems, getSingleProblem, getSolveProblem, getUnsolvedProblem, searchProblem } from "../controllers/problem.controller";
import { auth } from "../middlewares/auth";
import { isUser } from "../middlewares/user";
import router from "./user.route";

 const problemRoute = Router();
problemRoute.get('/problems', auth , isUser , getAllProblems );
problemRoute.get('/:problemId', auth, isUser, getSingleProblem);
problemRoute.get('/problem/solved' , auth, isUser, getSolveProblem);
problemRoute.get('/problem/unsolved' , auth, isUser, getUnsolvedProblem);
problemRoute.get('/search', auth , searchProblem);

export default problemRoute;