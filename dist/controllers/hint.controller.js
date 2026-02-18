"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProblemSolution = exports.getProblemHints = void 0;
const axios_1 = __importDefault(require("axios"));
const problemType_rubrics_1 = require("../ai/rubrics/problemType.rubrics");
const prisma_1 = __importDefault(require("../config/prisma"));
const toShortText = (value, maxLength = 800) => {
    if (value === null || value === undefined)
        return "";
    const text = typeof value === "string" ? value : JSON.stringify(value);
    return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
};
const normalizeHints = (hints, fallback) => {
    if (!Array.isArray(hints)) {
        return fallback;
    }
    const normalized = hints
        .map((hint) => (typeof hint === "string" ? hint.trim() : String(hint)))
        .filter((hint) => hint.length > 0)
        .slice(0, 6);
    return normalized.length > 0 ? normalized : fallback;
};
const buildFallbackHints = (params) => {
    const hints = [];
    hints.push("Start by defining the exact input-output contract for `solve(input)`.");
    if (params.difficulty === "HARD") {
        hints.push("Break the solution into smaller helper functions before full implementation.");
    }
    else {
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
const getProblemHints = async (req, res) => {
    try {
        const problemId = Number(req.params.problemId);
        if (!Number.isInteger(problemId) || problemId <= 0) {
            return res.status(400).json({ message: "Invalid problemId" });
        }
        const problem = await prisma_1.default.problem.findUnique({
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
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            const fallbackResponse = { hints: fallbackHints, source: "fallback" };
            return res.json(fallbackResponse);
        }
        const rubric = (0, problemType_rubrics_1.getProblemTypeRubric)(String(problem.type));
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
        const response = await axios_1.default.post("https://api.openai.com/v1/chat/completions", {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: "You are a technical coach. Provide practical hints only.",
                },
                {
                    role: "user",
                    content: prompt,
                },
            ],
        }, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            timeout: 12000,
        });
        const raw = response.data?.choices?.[0]?.message?.content;
        if (typeof raw !== "string" || raw.trim().length === 0) {
            const fallbackResponse = { hints: fallbackHints, source: "fallback" };
            return res.json(fallbackResponse);
        }
        const parsed = JSON.parse(raw);
        const hints = normalizeHints(parsed.hints, fallbackHints);
        const aiResponse = {
            hints,
            source: "ai",
        };
        return res.json(aiResponse);
    }
    catch (error) {
        console.error("GET_PROBLEM_HINTS_ERROR", error);
        return res.status(500).json({ message: "Failed to generate hints" });
    }
};
exports.getProblemHints = getProblemHints;
const getProblemSolution = async (req, res) => {
    try {
        const problemId = Number(req.params.problemId);
        const problem = await prisma_1.default.problem.findUnique({
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
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return res.json({
                solution: "// AI Solution is unavailable without API key.\n// Please check back later.",
                language: "javascript",
            });
        }
        const prompt = `
Provide a complete, efficient solution in JavaScript/Node.js for this problem.
Only return the code inside a JSON object: {"solution": "code...", "explanation": "..."}.
Do not include markdown triple backticks in the solution string.

Title: ${problem.title}
Description: ${problem.description}
`.trim();
        const response = await axios_1.default.post("https://api.openai.com/v1/chat/completions", {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            temperature: 0.1,
            response_format: { type: "json_object" },
            messages: [{ role: "user", content: prompt }],
        }, {
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            timeout: 15000,
        });
        const raw = response.data?.choices?.[0]?.message?.content;
        const parsed = JSON.parse(raw || "{}");
        return res.json({
            solution: parsed.solution || "// No solution generated",
            explanation: parsed.explanation || "",
        });
    }
    catch (error) {
        console.error("GET_PROBLEM_SOLUTION_ERROR", error);
        return res.status(500).json({ message: "Failed to generate solution" });
    }
};
exports.getProblemSolution = getProblemSolution;
