
import { Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middlewares/auth";
import { callAI } from "../ai/aiService";

export const chatWithProblemAI = async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;
    const problemId = Number(req.params.problemId);

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        title: true,
        description: true,
        difficulty: true,
        type: true,
        constraints: true,
      }
    });

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const systemPrompt = `You are a helpful coding assistant. A user is asking for help with a coding problem.
      
Problem Context:
Title: ${problem.title}
Difficulty: ${problem.difficulty}
Type: ${problem.type}
Description: ${problem.description}
Constraints: ${problem.constraints || "None"}

Instructions:
1. Answer the user's question directly and concisely.
2. If the user asks for hints, provide a progressive hint without giving away the full solution immediately.
3. If the user asks for the solution, politely encourage them to try more first, or give a high-level approach.
4. Be encouraging and technical.`;

    const text = await callAI(message, systemPrompt);

    if (!text) {
      return res.status(500).json({ message: "Failed to get AI response" });
    }

    return res.json({ response: text });

  } catch (error) {
    console.error("AI Chat Error:", error);
    return res.status(500).json({ message: "Failed to process your request" });
  }
};

export const chatGeneralAI = async (req: AuthRequest, res: Response) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    const systemPrompt = `You are an AI assistant for the DevChallenge Platform.
This platform allows developers to solve coding problems, participate in contests, and check leaderboards.

Instructions:
1. Answer valuable questions about the platform or coding in general.
2. If asked about specific problems, ask for the problem title or ID.
3. Keep responses helpful and concise.`;

    const text = await callAI(message, systemPrompt);

    if (!text) {
      return res.status(500).json({ message: "Failed to get AI response" });
    }

    return res.json({ response: text });

  } catch (error) {
    console.error("General AI Chat Error:", error);
    return res.status(500).json({ message: "Failed to process your request" });
  }
};
