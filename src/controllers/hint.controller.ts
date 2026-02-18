import axios from "axios";
import { Response } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { getProblemTypeRubric } from "../ai/rubrics/problemType.rubrics";
import prisma from "../config/prisma";
import { AuthRequest } from "../middlewares/auth";

interface HintResponse {
  hints: string[];
  source: "ai" | "fallback";
}

const toShortText = (value: unknown, maxLength = 800): string => {
  if (value === null || value === undefined) return "";
  const text = typeof value === "string" ? value : JSON.stringify(value);
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};

const normalizeHints = (hints: unknown, fallback: string[]): string[] => {
  if (!Array.isArray(hints)) {
    return fallback;
  }

  const normalized = hints
    .map((hint) => (typeof hint === "string" ? hint.trim() : String(hint)))
    .filter((hint) => hint.length > 0)
    .slice(0, 6);

  return normalized.length > 0 ? normalized : fallback;
};

const buildFallbackHints = (params: {
  difficulty: string;
  problemType: string;
  examples: unknown;
  constraints: string | null;
}): string[] => {
  const hints: string[] = [];

  hints.push("Start by defining the exact input-output contract for `solve(input)`.");

  if (params.difficulty === "HARD") {
    hints.push("Break the solution into smaller helper functions before full implementation.");
  } else {
    hints.push("Write a simple correct version first, then optimize if needed.");
  }

  if (params.constraints) {
    hints.push("Use constraints to pick data structures and avoid unnecessary complexity.");
  }

  if (Array.isArray(params.examples) && params.examples.length > 0) {
    hints.push("Validate your logic against every provided example before submitting.");
  }

  if (params.problemType === "AUTH_SECURITY") {
    hints.push("Prioritize safe defaults, validation, and secret handling.");
  }
  if (params.problemType === "SYSTEM_DESIGN") {
    hints.push("Think about idempotency and failure-recovery behavior.");
  }

  hints.push("Test edge cases: empty input, invalid fields, and boundary values.");
  return hints.slice(0, 6);
};

export const getProblemHints = async (req: AuthRequest, res: Response) => {
  try {
    const problemId = Number(req.params.problemId);
    if (!Number.isInteger(problemId) || problemId <= 0) {
      return res.status(400).json({ message: "Invalid problemId" });
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        id: true,
        title: true,
        description: true,
        difficulty: true,
        type: true,
        examples: true,
        constraints: true,
      },
    });

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const fallbackHints = buildFallbackHints({
      difficulty: String(problem.difficulty),
      problemType: String(problem.type),
      examples: problem.examples,
      constraints: problem.constraints,
    });

    const rubric = getProblemTypeRubric(String(problem.type));
    const prompt = `
Generate concise coding hints for this backend problem.
Do not reveal full solution code.
Return ONLY JSON: {"hints": ["hint1", "hint2", ...]}.
Limit to 4-6 hints.

Title: ${problem.title}
Difficulty: ${problem.difficulty}
Problem Type: ${problem.type}
Description: ${toShortText(problem.description, 2000)}
Constraints: ${toShortText(problem.constraints, 800)}
Examples: ${toShortText(problem.examples, 1200)}
Rubric: ${rubric}
`.trim();

    // Try Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, responseMimeType: "application/json" },
        });
        const parsed = JSON.parse(result.response.text()) as { hints?: unknown };
        return res.json({ hints: normalizeHints(parsed.hints, fallbackHints), source: "ai" });
      } catch (e) {
        console.error("Gemini hints error:", e);
      }
    }

    // Try OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const response: any = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: "You are a technical coach. JSON output only." },
              { role: "user", content: prompt },
            ],
          },
          { headers: { Authorization: `Bearer ${openaiKey}` }, timeout: 10000 }
        );
        const raw = response.data?.choices?.[0]?.message?.content;
        const parsed = JSON.parse(raw || "{}") as { hints?: unknown };
        return res.json({ hints: normalizeHints(parsed.hints, fallbackHints), source: "ai" });
      } catch (e) {
        console.error("OpenAI hints error:", e);
      }
    }

    return res.json({ hints: fallbackHints, source: "fallback" });
  } catch (error) {
    console.error("GET_PROBLEM_HINTS_ERROR", error);
    return res.status(500).json({ message: "Failed to generate hints" });
  }
};

export const getProblemSolution = async (req: AuthRequest, res: Response) => {
  try {
    const problemId = Number(req.params.problemId);
    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
      select: {
        title: true,
        description: true,
        type: true,
      },
    });

    if (!problem) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const prompt = `
Provide a complete, efficient solution in JavaScript/Node.js for this problem.
Only return the code inside a JSON object: {"solution": "code...", "explanation": "..."}.
Do not include markdown triple backticks in the solution string.

Title: ${problem.title}
Description: ${problem.description}
`.trim();

    // Try Gemini
    const geminiKey = process.env.GEMINI_API_KEY;
    if (geminiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.1, responseMimeType: "application/json" },
        });
        const parsed = JSON.parse(result.response.text()) as { solution?: string; explanation?: string };
        return res.json({
          solution: parsed.solution || "// No solution generated",
          explanation: parsed.explanation || "",
        });
      } catch (e) {
        console.error("Gemini solution error:", e);
      }
    }

    // Try OpenAI
    const openaiKey = process.env.OPENAI_API_KEY;
    if (openaiKey) {
      try {
        const response: any = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            temperature: 0.1,
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
          },
          { headers: { Authorization: `Bearer ${openaiKey}` }, timeout: 12000 }
        );
        const raw = response.data?.choices?.[0]?.message?.content;
        const parsed = JSON.parse(raw || "{}") as { solution?: string; explanation?: string };
        return res.json({
          solution: parsed.solution || "// No solution generated",
          explanation: parsed.explanation || "",
        });
      } catch (e) {
        console.error("OpenAI solution error:", e);
      }
    }

    return res.json({
      solution: "// AI Solution is unavailable without API key.\n// Please check back later.",
      language: "javascript",
    });
  } catch (error) {
    console.error("GET_PROBLEM_SOLUTION_ERROR", error);
    return res.status(500).json({ message: "Failed to generate solution" });
  }
};
