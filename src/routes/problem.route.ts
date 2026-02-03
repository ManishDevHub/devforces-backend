
import { Router } from "express";
import { getAllProblems, getSingleProblem, getSolveProblem, getUnsolvedProblem, searchProblem } from "../controllers/problem.controller";
import { auth } from "../middlewares/auth";
import { isUser } from "../middlewares/user";


 const problemRoute = Router();
problemRoute.get('/problem/problems', auth , isUser , getAllProblems );
problemRoute.get('problem/:problemId', auth, isUser, getSingleProblem);
problemRoute.get('/problem/solved' , auth, isUser, getSolveProblem);
problemRoute.get('/problem/unsolved' , auth, isUser, getUnsolvedProblem);
problemRoute.get('/problem/search', auth ,isUser, searchProblem);

export default problemRoute;