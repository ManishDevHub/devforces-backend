
import { Router } from "express";
import { auth } from "../middlewares/auth";
import { isUser } from "../middlewares/user";
import { getAllContest, getContestByType, getContestDetails, getLiveContest, getPastContest, getUpcomingContest, joinContest } from "../controllers/contest.controller";



const contestRoute = Router();

contestRoute.get('/contest/allcontest', auth, isUser, getAllContest);
contestRoute.get('/contest/upcoming', auth, isUser, getUpcomingContest);
contestRoute.get('/contest/live', auth , isUser, getLiveContest);
contestRoute.get('/contest/past', auth, isUser, getPastContest);
contestRoute.get('/contest/type/:type', auth, isUser, getContestByType);
contestRoute.get('/contest/:contestId' , auth , isUser , getContestDetails);
contestRoute.post('/contest/:contestId/join', auth , isUser, joinContest);

export default contestRoute;