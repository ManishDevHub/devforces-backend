

import prisma from "../config/prisma";
import { redisQueueConfig } from "../config/redis";

import { Worker } from "bullmq"
import { runDocker } from "../utils/runDocker";
import { run } from "node:test";

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


          
          // 3. AI evaluation
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

             // 3. AI evaluation
             // 4. Leaderboard update (Redis)

        }


    },
    {
        connection: redisQueueConfig,
    }
)