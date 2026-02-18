import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

import { getProblemTypeRubric } from "./rubrics/problemType.rubrics";
import { Status } from "../generated/prisma/enums";
import { SandboxTestResult } from "../utils/runDocker";

export interface SubmissionEvaluationInput {
  problem: string;
  constraints: string;
  language: string;
  code: string;
  testResult: SandboxTestResult;
  problemType: string;
}

export interface SubmissionEvaluationResult {
  score: number;
  verdict: Status;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  securityIssues: string[];
  improvements: string[];
}

const clampScore = (score: unknown): number => {
  const parsed = Number(score);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(0, Math.min(100, Math.round(parsed)));
};

const mapVerdict = (value: unknown): Status => {
  const verdict = typeof value === "string" ? value.toUpperCase() : "";

  if (verdict === "ACCEPTED" || verdict === "PASSED") return Status.ACCEPTED;
  if (verdict === "TIME_LIMIT") return Status.TIME_LIMIT;
  if (verdict === "COMPILATION_ERROR") return Status.COMPILATION_ERROR;
  if (verdict === "RUNTIME_ERROR") return Status.RUNTIME_ERROR;
  if (verdict === "WRONG_ANSWER" || verdict === "FAILED") return Status.WRONG_ANSWER;

  return Status.WRONG_ANSWER;
};

const deriveVerdictFromSandbox = (testResult: SandboxTestResult): Status => {
  if (testResult.status === "PASSED") return Status.ACCEPTED;

  const errorText = (testResult.error || "").toLowerCase();
  if (errorText.includes("timeout") || errorText.includes("time limit")) return Status.TIME_LIMIT;
  if (errorText.includes("compile") || errorText.includes("syntax")) return Status.COMPILATION_ERROR;
  if (errorText.includes("runtime") || errorText.includes("exception")) return Status.RUNTIME_ERROR;

  return Status.WRONG_ANSWER;
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : String(item)))
    .filter(Boolean);
};

const buildFallbackReview = (
  input: SubmissionEvaluationInput,
  sandboxVerdict: Status
): SubmissionEvaluationResult => {
  const total = input.testResult.total || 0;
  const passed = input.testResult.passed || 0;
  const ratio = total > 0 ? passed / total : 0;

  let summary = "Submission needs improvement.";
  if (sandboxVerdict === Status.ACCEPTED) {
    summary = "All sandbox tests passed. Your solution logic is correct. Consider optimizing code quality and security.";
  } else if (sandboxVerdict === Status.WRONG_ANSWER) {
    summary = "Logic error: Some test cases failed. Revisit edge cases and output formatting.";
  } else if (sandboxVerdict === Status.COMPILATION_ERROR) {
    summary = "Syntax error: Compilation failed. Fix language-specific issues.";
  } else if (sandboxVerdict === Status.RUNTIME_ERROR) {
    summary = "Performance/Stability error: Runtime error occurred. Add guards for unexpected inputs.";
  } else if (sandboxVerdict === Status.TIME_LIMIT) {
    summary = "Efficiency error: Time limit exceeded. Optimize algorithm complexity.";
  }

  return {
    score: clampScore(sandboxVerdict === Status.ACCEPTED ? 70 + ratio * 30 : ratio * 60),
    verdict: sandboxVerdict,
    summary,
    strengths:
      sandboxVerdict === Status.ACCEPTED
        ? ["Passes all provided tests", "Correct implementation of requirements"]
        : ["Code structure is mostly intact"],
    weaknesses:
      sandboxVerdict === Status.ACCEPTED
        ? ["Limited code quality review (AI unavailable)"]
        : ["Does not satisfy all test expectations"],
    securityIssues: [],
    improvements: [
      `Rubric focus: ${getProblemTypeRubric(input.problemType).trim()}`,
      "Add explicit edge-case handling",
      "Optimize performance for larger datasets",
    ],
  };
};

const normalizeModelReview = (
  candidate: unknown,
  fallback: SubmissionEvaluationResult
): SubmissionEvaluationResult => {
  if (!candidate || typeof candidate !== "object") {
    return fallback;
  }

  const review = candidate as Record<string, unknown>;
  const verdict = mapVerdict(review.verdict ?? review.status ?? fallback.verdict);
  return {
    score: clampScore(review.score ?? fallback.score),
    verdict,
    summary:
      typeof review.summary === "string" && review.summary.trim().length > 0
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

export const evaluateSubmission = async (
  input: SubmissionEvaluationInput
): Promise<SubmissionEvaluationResult> => {
  const sandboxVerdict = deriveVerdictFromSandbox(input.testResult);
  const fallback = buildFallbackReview(input, sandboxVerdict);

  const prompt = `
You are a senior backend code reviewer. Evaluate this submission.
Return ONLY valid JSON.

Problem type rubric:
${getProblemTypeRubric(input.problemType)}

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

JSON Schema:
{
  "score": number (0-100),
  "verdict": "ACCEPTED" | "WRONG_ANSWER" | "RUNTIME_ERROR" | "COMPILATION_ERROR" | "TIME_LIMIT",
  "summary": "concise overview of the solution quality",
  "strengths": ["list of what was done well"],
  "weaknesses": ["list of areas for improvement"],
  "securityIssues": ["any potential vulnerabilities"],
  "improvements": ["specific actionable advice"]
}
`.trim();

  // Try Groq first (User preference)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const response: any = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: "You are a strict technical reviewer. JSON output only." },
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        },
        {
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          timeout: 10000,
        }
      );
      const raw = response.data?.choices?.[0]?.message?.content;
      if (raw) return normalizeModelReview(JSON.parse(raw), fallback);
    } catch (e) {
      console.error("Groq eval error:", e);
    }
  }

  // Try Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });
      const raw = result.response.text();
      return normalizeModelReview(JSON.parse(raw), fallback);
    } catch (e) {
      console.error("Gemini eval error:", e);
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
          messages: [
            { role: "system", content: "You are a strict technical reviewer. JSON output only." },
            { role: "user", content: prompt },
          ],
        },
        {
          headers: { Authorization: `Bearer ${openaiKey}` },
          timeout: 10000,
        }
      );
      const raw = response.data?.choices?.[0]?.message?.content;
      if (raw) return normalizeModelReview(JSON.parse(raw), fallback);
    } catch (e) {
      console.error("OpenAI eval error:", e);
    }
  }

  return fallback;
};
