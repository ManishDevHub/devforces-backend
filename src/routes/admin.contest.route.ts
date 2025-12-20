
import { Router } from "express";
import { auth } from "../middlewares/auth";
import { isAdmin } from "../middlewares/admin";
import { addProblemToContest, createContest, deleteAllContest, deleteConById, getAllConByAdmin, getById, updateContest } from "../controllers/admin/admin.contest.controller";



const adminContestRoute = Router();

adminContestRoute.post('/createContest', auth,isAdmin, createContest);
adminContestRoute.put('/updateContest/:id', auth , isAdmin , updateContest);
adminContestRoute.delete('/deleteContest/:id', auth , isAdmin, deleteConById);
adminContestRoute.delete('/deleteAllContest' , auth , isAdmin , deleteAllContest);
adminContestRoute.get('/getAllContestByadmin', auth , isAdmin , getAllConByAdmin);
adminContestRoute.get('/getContestByIdByAdmin/:id' , auth , isAdmin , getById);
adminContestRoute.post("/contest/:contestId/problems" , auth ,isAdmin , addProblemToContest);

export default adminContestRoute;
