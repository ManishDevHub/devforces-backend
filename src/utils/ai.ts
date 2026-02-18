
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export interface AIReviewResult {
  score: number;
  feedback: {
    summary: string;
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    securityIssues?: string[];
  };
}

export const getAIReview = async (
  code: string,
  language: string,
  problemTitle: string,
  problemDescription: string
): Promise<AIReviewResult> => {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
You are an expert code reviewer and interviewer.
Review the following code submission for the coding problem "${problemTitle}".

Problem Description:
${problemDescription}

Candidate's Code (${language}):
${code}

Your task is to:
1. Analyze the code for correctness, efficiency, readability, and security.
2. Assign a score from 0 to 100 based on how well it solves the problem and code quality.
3. Provide constructive feedback.

Return ONLY a valid JSON object with the following structure (no markdown, no code blocks):
{
  "score": number,
  "feedback": {
    "summary": "Brief summary of the submission",
    "strengths": ["List of 2-3 strong points"],
    "weaknesses": ["List of 2-3 weak points"],
    "improvements": ["List of specific suggestions for improvement"],
    "securityIssues": ["List of any security vulnerabilities found (optional)"]
  }
}
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean up potential markdown formatting if the model adds it
    const jsonString = text.replace(/```json/g, "").replace(/```/g, "").trim();
    
    const parsed = JSON.parse(jsonString);
    
    // Ensure score is a number and within bounds
    const score = Math.min(100, Math.max(0, Number(parsed.score) || 0));

    return {
      score,
      feedback: {
        summary: parsed.feedback?.summary || "No summary provided.",
        strengths: Array.isArray(parsed.feedback?.strengths) ? parsed.feedback.strengths : [],
        weaknesses: Array.isArray(parsed.feedback?.weaknesses) ? parsed.feedback.weaknesses : [],
        improvements: Array.isArray(parsed.feedback?.improvements) ? parsed.feedback.improvements : [],
        securityIssues: Array.isArray(parsed.feedback?.securityIssues) ? parsed.feedback.securityIssues : [],
      }
    };
  } catch (error) {
    console.error("AI Review Error:", error);
    // Fallback in case of error
    return {
      score: 0,
      feedback: {
        summary: "AI Review failed due to technical issues.",
        strengths: [],
        weaknesses: [],
        improvements: [],
      }
    };
  }
};
