import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import router from "./routes/user.route";
import problemRoute from "./routes/problem.route";
import contestRoute from "./routes/contest.route";
import AdminRouter from "./routes/adminprofile.route";
import { createProblem } from "./controllers/admin/admin.problem.controller";
import createProbelmRoute from "./routes/admin.problem.route";
import adminContestRoute from "./routes/admin.contest.route";
import submissionRoute from "./routes/submission.route";

const PORT = process.env.PORT || 5000

dotenv.config();

const app = express();

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json());

interface AuthRequest extends Request{
     user?: any
  
}

app.use("/api/user", router);
app.use('/api/user', problemRoute);
app.use('/api/user', contestRoute);
app.use('/api/user', submissionRoute);

app.use('/api/admin', AdminRouter);
app.use('/api/admin', createProbelmRoute);
app.use('/api/admin', adminContestRoute);





app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
