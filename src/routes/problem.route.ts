
import { Router } from "express";
import {
  getAllProblems,
  getSingleProblem,
  getSolveProblem,
  getUnsolvedProblem,
  searchProblem,
} from "../controllers/problem.controller";
import { auth } from "../middlewares/auth";
import { isUser } from "../middlewares/user";
import { getProblemHints, getProblemSolution } from "../controllers/hint.controller";

const problemRoute = Router();

// Static routes MUST come before parameterized routes
problemRoute.get("/problem/problems", auth, isUser, getAllProblems);
problemRoute.get("/problem/solved", auth, isUser, getSolveProblem);
problemRoute.get("/problem/unsolved", auth, isUser, getUnsolvedProblem);
problemRoute.get("/problem/search", auth, isUser, searchProblem);

// Parameterized routes come after static ones
problemRoute.get("/problem/:problemId", auth, isUser, getSingleProblem);
problemRoute.get("/problem/:problemId/hints", auth, isUser, getProblemHints);
problemRoute.get("/problem/:problemId/solution", auth, isUser, getProblemSolution);

export default problemRoute;
