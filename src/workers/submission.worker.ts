

import prisma from "../config/prisma";
import { redisQueueConfig } from "../config/redis";
import { Worker } from "bullmq"
import { runDocker } from "../utils/runDocker";
import { evaluateSubmission } from "../ai/evaluateSubmission";
import { constants } from "buffer";
import { Language } from "../generated/prisma";
import sandbox from "bullmq/dist/esm/classes/sandbox";
import { date } from "zod";


new Worker( "submission-queue", 
    async (job) => {
        const { contestId , type , submissionId} = job.data;

        console.log("processing submission:" , submissionId, type);

        if( type === "NORMAL"){
            
            const submission = await prisma.submission.findUnique({
                where:{ id: submissionId},
                include:{
                    problem: true,
                }
            })

            if(!submission) return ;

            const result = await runDocker({
                language: submission.language,
                code: submission.code,
                tests: submission.problem.examples
            })

            await prisma.submission.update({
                where:{ id: submissionId},
                data:{
                    status:result.status,
                    executionMs: result.time
                }
            })


            const aiResult = await evaluateSubmission({
                problem: submission.problem.description,
                constants: submission.problem.constraints,
                language: submission.language,
                code: submission.code,
                testResult:sandboxResult,
                problemType: submission.problem,
            })

            await prisma.submission.update({
                where:{id: submissionId},
                data:{
                    score: aiResult,
                    status: aiResult.Status,
                    feedback: aiResult
                }
            })

          
        
          // 4. Leaderboard update (Redis)
        }

        if(type === "CONTEST"){
            const submission = await prisma.contestSubmission.findUnique({

                where:{id:submissionId},
                include:{
                    problem:true,
                    contest: true
                }
            })

            if(!submission) return;
           
const result = await runDocker({
    language: submission.language,
    code: submission.code,
    tests: submission.problem.examples
})

await prisma.contestSubmission.update({
    where:{ id: submissionId},
    data:{
        status: result.status,
        executionMs:result.time
    }
})
 const aiResult = await evaluateSubmission({
                problem: submission.problem.description,
                constants: submission.problem.constraints,
                language: submission.language,
                code: submission.code,
                testResult:sandboxResult,
                problemType: submission.problem,
            })

            await prisma.contestSubmission.update({
                where:{id: submissionId},
                data:{
                    score: aiResult,
                    status: aiResult.Status,
                    feedback: aiResult
                }
            })

            
             // 4. Leaderboard update (Redis)

        }


    },
    {
        connection: redisQueueConfig,
    }
)