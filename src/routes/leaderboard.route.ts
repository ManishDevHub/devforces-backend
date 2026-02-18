
import { Router } from "express";
import { getLeaderboard } from "../controllers/leaderboard.controller";
import { auth } from "../middlewares/auth";

const leaderboardRoute = Router();

leaderboardRoute.get("/leaderboard", auth, getLeaderboard);

export default leaderboardRoute;
