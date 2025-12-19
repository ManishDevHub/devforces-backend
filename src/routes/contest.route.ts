
import { Router } from "express";
import { auth } from "../middlewares/auth";
import { isUser } from "../middlewares/user";
import { getAllContest, getContestByType, getContestDetails, getLiveContest, getPastContest, getUpcommingContest, joinContest } from "../controllers/contest.controller";



const contestRoute = Router();

contestRoute.get('/allcontest', auth, isUser, getAllContest);
contestRoute.get('/upcomming', auth, isUser, getUpcommingContest);
contestRoute.get('/live', auth , isUser, getLiveContest);
contestRoute.get('/past', auth, isUser, getPastContest);
contestRoute.get('/type/:type', auth, isUser, getContestByType);
contestRoute.get('/:contestId' , auth , isUser , getContestDetails);
contestRoute.get('/:contestId/join', auth , isUser, joinContest);

export default contestRoute;