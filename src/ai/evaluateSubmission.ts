

import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";

import { evaluationPrompt } from "./prompts/evaluator";


const model = new ChatOpenAI({
    modelName: "gpt-4o-mini",
    temprerature: 0,
})

export  async function evaluateSubmission(input:any) {
    const prompt = new PromptTemplate({
        templete: evaluationPrompt,
        inputVariable: Object.keys(input),
    })

    const chain = prompt.pipe(model),
    const result = await chain.invoke(input)

    return JSON.parse(result.content as string)
    
}