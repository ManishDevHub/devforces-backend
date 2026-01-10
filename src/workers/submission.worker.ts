

import prisma from "../config/prisma";
import { redisQueueConfig } from "../config/redis";
import { Worker } from "bullmq"
import { runDocker } from "../utils/runDocker";
import { evaluateSubmission } from "../ai/evaluateSubmission";






new Worker( "submission-queue", 
    async (job) => {
        const {  type , submissionId} = job.data ;

        if(!submissionId || !type){
            throw new Error("Invalid Job payload")
        }

        console.log("processing submission:" , submissionId, type);
 

        if( type === "NORMAL"){
            
            const submission = await prisma.submission.findUnique({
                where:{ id: submissionId},
                include:{
                    problem: true,
                }
            })

            if(!submission) return ;

            const sandboxresult = await runDocker({
                language: submission.language,
                code: submission.code,
                tests: submission.problem.examples
            })

            await prisma.submission.update({
                where:{ id: submissionId},
                data:{
                    status:sandboxresult.status,
                    executionMs: sandboxresult.time
                }
            })


            const aiResult = await evaluateSubmission({
                problem: submission.problem.description,
                constants: submission.problem.constraints,
                language: submission.language,
                code: submission.code,
                testResult:sandboxresult,
                problemType: submission.problem.type
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
                testResult:result,
                problemType: submission.problem.type
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