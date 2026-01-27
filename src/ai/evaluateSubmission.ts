

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { getProblemTypeRubric } from "./rubrics/problemType.rubrics";
import { evaluationPrompt } from "./prompts/evaluator";




const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temprerature: 0,
})

export  async function evaluateSubmission(input:any) {
    const rubic = getProblemTypeRubric(input.problemType)
    const prompt = new PromptTemplate({
        templete: evaluationPrompt,
        inputVariable: Object.keys(input),
    })

    const chain = prompt.pipe(model);
    const result = await chain.invoke({
        ...input,
        ProblemType:rubic
    })
     const raw = result.content.toString().trim();

    
     try {
    return JSON.parse(raw);
  } catch (err) {
    console.error("AI returned invalid JSON:", raw);
    throw new Error("AI evaluation failed: invalid JSON");
  }
    
}