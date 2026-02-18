import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

const getGeminiModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
};

export const callAI = async (prompt: string, systemPrompt?: string): Promise<string | null> => {
  // 1. Try Groq (User preference)
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const response: any = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: prompt },
          ],
          temperature: 0.7,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${groqKey}`,
            "Content-Type": "application/json",
          },
          timeout: 15000,
        }
      );
      const content = response.data?.choices?.[0]?.message?.content;
      if (content) {
        console.log("Groq API response received successfully");
        return content;
      }
      return null;
    } catch (error: any) {
      console.error("Groq AI error:", error.response?.data || error.message);
    }
  }

  // 2. Try Gemini
  const gemini = getGeminiModel();
  if (gemini) {
    try {
      const result = await gemini.generateContent({
        contents: [
            ...(systemPrompt ? [{ role: 'user', parts: [{ text: `System Instruction: ${systemPrompt}` }] }] : []),
            { role: 'user', parts: [{ text: prompt }] }
        ],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
        },
      });
      return result.response.text();
    } catch (error) {
      console.error("Gemini AI error:", error);
    }
  }

  // 3. Try OpenAI Fallback
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const response: any = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [
            ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
            { role: "user", content: prompt },
          ],
          temperature: 0.1,
          response_format: { type: "json_object" },
        },
        {
          headers: { Authorization: `Bearer ${openaiKey}` },
          timeout: 10000,
        }
      );
      return response.data?.choices?.[0]?.message?.content || null;
    } catch (error) {
      console.error("OpenAI error:", error);
    }
  }

  return null;
};
