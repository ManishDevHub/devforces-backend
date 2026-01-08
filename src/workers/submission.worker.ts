

import prisma from "../config/prisma";
import { redisQueueConfig } from "../config/redis";

import { Worker } from "bullmq"

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
            // TODO (later)
           // 1. Run sandbox
           // 2. Run test cases
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
             // 1. Run sandbox
             // 2. Run test cases
             // 3. AI evaluation
             // 4. Leaderboard update (Redis)

        }


    },
    {
        connection: redisQueueConfig,
    }
)