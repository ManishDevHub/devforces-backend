export const evaluationPrompt = `

You are a senior backend engineer reviewing a developer submission.

Problem:
{{problem}}

Constraints:
{{constraints}}

Language:
{{language}}

Submission code:
{{code}}

Test execution result:
{{testResult}}

Problem type:
{{problemType}}

Evaluate the submission strictly.

Return ONLY valid JSON in this format:
{
  "score": number (0-100),
  "verdict": "PASSED" | "FAILED",
  "strengths": string[],
  "weaknesses": string[],
  "securityIssues": string[],
  "improvements": string[]
}

Rules:
- Penalize missing error handling
- Penalize insecure patterns
- Do NOT assume functionality if tests fail
- Be concise but professional

`;
