
import { Router } from "express";
import { auth } from "../middlewares/auth";
import { isUser } from "../middlewares/user";
import { chatWithProblemAI, chatGeneralAI } from "../controllers/ai.controller";

const aiRoute = Router();

// Specific problem chat
aiRoute.post("/problem/:problemId/chat", auth, isUser, chatWithProblemAI);

// General AI chat
aiRoute.post("/ai/chat", auth, isUser, chatGeneralAI);

export default aiRoute;
