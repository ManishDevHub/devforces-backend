import { Router } from "express";
import { auth } from "../middlewares/auth";
import { submissionProblem } from "../controllers/problem.controller";
import { submissionContestProblem } from "../controllers/contest.controller";


const submissionRoute = Router();

submissionRoute.post("/problems/:problemId/submit", auth , submissionProblem);
submissionRoute.post( "/contests/:contestId/problems/:problemId/submit", auth, submissionContestProblem)
  

export default submissionRoute;