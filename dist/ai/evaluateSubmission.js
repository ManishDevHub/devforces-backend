"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateSubmission = void 0;
const axios_1 = __importDefault(require("axios"));
const problemType_rubrics_1 = require("./rubrics/problemType.rubrics");
const enums_1 = require("../generated/prisma/enums");
const clampScore = (score) => {
    const parsed = Number(score);
    if (Number.isNaN(parsed))
        return 0;
    return Math.max(0, Math.min(100, Math.round(parsed)));
};
const mapVerdict = (value) => {
    const verdict = typeof value === "string" ? value.toUpperCase() : "";
    if (verdict === "ACCEPTED" || verdict === "PASSED")
        return enums_1.Status.ACCEPTED;
    if (verdict === "TIME_LIMIT")
        return enums_1.Status.TIME_LIMIT;
    if (verdict === "COMPILATION_ERROR")
        return enums_1.Status.COMPILATION_ERROR;
    if (verdict === "RUNTIME_ERROR")
        return enums_1.Status.RUNTIME_ERROR;
    if (verdict === "WRONG_ANSWER" || verdict === "FAILED")
        return enums_1.Status.WRONG_ANSWER;
    return enums_1.Status.WRONG_ANSWER;
};
const deriveVerdictFromSandbox = (testResult) => {
    if (testResult.status === "PASSED")
        return enums_1.Status.ACCEPTED;
    const errorText = (testResult.error || "").toLowerCase();
    if (errorText.includes("timeout") || errorText.includes("time limit"))
        return enums_1.Status.TIME_LIMIT;
    if (errorText.includes("compile") || errorText.includes("syntax"))
        return enums_1.Status.COMPILATION_ERROR;
    if (errorText.includes("runtime") || errorText.includes("exception"))
        return enums_1.Status.RUNTIME_ERROR;
    return enums_1.Status.WRONG_ANSWER;
};
const toStringArray = (value) => {
    if (!Array.isArray(value))
        return [];
    return value
        .map((item) => (typeof item === "string" ? item.trim() : String(item)))
        .filter(Boolean);
};
const buildFallbackReview = (input, sandboxVerdict) => {
    const total = input.testResult.total || 0;
    const passed = input.testResult.passed || 0;
    const ratio = total > 0 ? passed / total : 0;
    let summary = "Submission needs improvement.";
    if (sandboxVerdict === enums_1.Status.ACCEPTED) {
        summary = "All sandbox tests passed. Good job.";
    }
    else if (sandboxVerdict === enums_1.Status.WRONG_ANSWER) {
        summary = "Some test cases failed. Revisit edge cases and output formatting.";
    }
    else if (sandboxVerdict === enums_1.Status.COMPILATION_ERROR) {
        summary = "Compilation failed. Fix syntax and language-specific issues.";
    }
    else if (sandboxVerdict === enums_1.Status.RUNTIME_ERROR) {
        summary = "Runtime error occurred. Add guards for null/invalid input and edge paths.";
    }
    else if (sandboxVerdict === enums_1.Status.TIME_LIMIT) {
        summary = "Time limit exceeded. Optimize algorithm complexity.";
    }
    return {
        score: clampScore(sandboxVerdict === enums_1.Status.ACCEPTED ? 70 + ratio * 30 : ratio * 60),
        verdict: sandboxVerdict,
        summary,
        strengths: sandboxVerdict === enums_1.Status.ACCEPTED
            ? ["Passes all provided tests", "Function contract appears valid"]
            : ["Submission received and executed in sandbox"],
        weaknesses: sandboxVerdict === enums_1.Status.ACCEPTED
            ? []
            : ["Does not satisfy all test expectations"],
        securityIssues: [],
        improvements: [
            `Review rubric focus: ${(0, problemType_rubrics_1.getProblemTypeRubric)(input.problemType).trim()}`,
            "Add explicit edge-case handling",
            "Keep output format exactly as expected",
        ],
    };
};
const normalizeModelReview = (candidate, fallback) => {
    if (!candidate || typeof candidate !== "object") {
        return fallback;
    }
    const review = candidate;
    const verdict = mapVerdict(review.verdict ?? review.status ?? fallback.verdict);
    return {
        score: clampScore(review.score ?? fallback.score),
        verdict,
        summary: typeof review.summary === "string" && review.summary.trim().length > 0
            ? review.summary.trim()
            : fallback.summary,
        strengths: toStringArray(review.strengths).length
            ? toStringArray(review.strengths)
            : fallback.strengths,
        weaknesses: toStringArray(review.weaknesses).length
            ? toStringArray(review.weaknesses)
            : fallback.weaknesses,
        securityIssues: toStringArray(review.securityIssues),
        improvements: toStringArray(review.improvements).length
            ? toStringArray(review.improvements)
            : fallback.improvements,
    };
};
const evaluateSubmission = async (input) => {
    const sandboxVerdict = deriveVerdictFromSandbox(input.testResult);
    const fallback = buildFallbackReview(input, sandboxVerdict);
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        return fallback;
    }
    try {
        const prompt = `
You are a senior backend reviewer. Return ONLY valid JSON.

Problem type rubric:
${(0, problemType_rubrics_1.getProblemTypeRubric)(input.problemType)}

Problem:
${input.problem}

Constraints:
${input.constraints}

Language:
${input.language}

Submission code:
${input.code}

Sandbox test result:
${JSON.stringify(input.testResult)}

Output JSON shape:
{
  "score": number (0-100),
  "verdict": "ACCEPTED" | "WRONG_ANSWER" | "RUNTIME_ERROR" | "COMPILATION_ERROR" | "TIME_LIMIT",
  "summary": "string",
  "strengths": ["string"],
  "weaknesses": ["string"],
  "securityIssues": ["string"],
  "improvements": ["string"]
}
`.trim();
        const response = await axios_1.default.post("https://api.openai.com/v1/chat/completions", {
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            temperature: 0.1,
            response_format: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: "You are strict and concise. Always output valid JSON only.",
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
            return fallback;
        }
        const parsed = JSON.parse(raw);
        return normalizeModelReview(parsed, fallback);
    }
    catch (error) {
        console.error("AI evaluation fallback:", error);
        return fallback;
    }
};
exports.evaluateSubmission = evaluateSubmission;
