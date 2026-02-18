import { Router } from "express";
import { auth } from "../middlewares/auth";
import { submissionProblem } from "../controllers/problem.controller";
import { submissionContestProblem } from "../controllers/contest.controller";

import { getSubmissionResult, getProblemSubmissions, getUserHistory } from "../controllers/submission.controller";
import { isUser } from "../middlewares/user";


const submissionRoute = Router();

submissionRoute.post("/problems/:problemId/submit", auth, isUser, submissionProblem);
submissionRoute.get("/problems/:problemId/submissions", auth, isUser, getProblemSubmissions);
submissionRoute.post("/contests/:contestId/problems/:problemId/submit", auth, isUser, submissionContestProblem);
submissionRoute.get("/submissions/:submissionId", auth, isUser, getSubmissionResult);
submissionRoute.get("/history", auth, isUser, getUserHistory);

export default submissionRoute;
