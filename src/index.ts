import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import router from "./routes/user.route";
import problemRoute from "./routes/problem.route";
import contestRoute from "./routes/contest.route";
import AdminRouter from "./routes/adminprofile.route";
import createProbelmRoute from "./routes/admin.problem.route";
import adminContestRoute from "./routes/admin.contest.route";
import submissionRoute from "./routes/submission.route";
import aiRoute from "./routes/ai.route";
import leaderboardRoute from "./routes/leaderboard.route";

import "./workers/submission.worker";

dotenv.config();

const PORT = process.env.PORT || 4000;

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());

// User routes
app.use("/api/user", router);
app.use("/api/user", problemRoute);
app.use("/api/user", contestRoute);
app.use("/api/user", submissionRoute);
app.use("/api/user", aiRoute);
app.use("/api/user", leaderboardRoute);

// Admin routes
app.use("/api/admin", AdminRouter);
app.use("/api/admin", createProbelmRoute);
app.use("/api/admin", adminContestRoute);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
