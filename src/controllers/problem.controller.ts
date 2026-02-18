
import { Request, Response } from "express";
import prisma from "../config/prisma";
import { AuthRequest } from "../middlewares/auth";
import { submissionQueue } from "../queues/submission.queue";
import { Language, Status } from "../generated/prisma/enums";
import { getAIReview } from "../utils/ai";

export const getAllProblems = async ( req: AuthRequest, res:Response) =>{
    try{

        const problems =  await prisma.problem.findMany({
            select:{
                id:true,
                title: true,
                difficulty:true,
                type:true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc"}
        })
        res.json(problems);

    } catch(error){
        console.log(error);
        res.status(500).json({ Message: " Failed to fetch problems"})
    }
}


export const getSingleProblem = async ( req:AuthRequest, res: Response) => {
    try{

     
        const problemId = Number( req.params.problemId);
      

       

        const problem = await prisma.problem.findUnique({
            where: { id: problemId},
            select:{
                id: true,
                title:true,
                description: true,
                difficulty: true,
                type: true,
                examples: true,
                constraints: true,
            }
        })

        if( !problem){
            return res.status(404).json({ Message: " Problem not found"})
        }

        res.json(problem);

    } catch(error){
        console.error(error);
        res.status(500).json({ message: " Failed to Fetch problem"});
    }
}


export const getSolveProblem = async ( req: AuthRequest, res: Response) =>{

    try{
        const userId = req.user.id;

    const solved = await prisma.submission.findMany({
        where:{ 
            userId: userId,
            status: "ACCEPTED"
        },
        distinct: ["problemId"],
        select:{
            problem:{
                select:{
                    id: true,
                    title: true,
                    difficulty: true,
                }
            }
        }
    })

        res.json(solved.map(s => s.problem));
    }catch(error){
        res.status(500).json({ message: " Failed to Fetch  solved problem"});
    }
     
}

export const getUnsolvedProblem = async( req: AuthRequest, res: Response) =>{

    try{
        const userId = req.user.id;

        const solvedId = await prisma.submission.findMany({
            where: {
             userId,
                status: "ACCEPTED",
            },
            distinct:["problemId"],
            select: { problemId : true}
        })

        const solvedProblemIds = solvedId.map(p => p.problemId);

        const unsolved = await prisma.problem.findMany({
            where: { 
                id: { notIn: solvedProblemIds}
            },
            select: {
                id: true,
                title: true,
                difficulty: true,
            }
        })

        res.json(unsolved);


    } catch(error){
        res.status(500).json({ message: " Failed to Fetch unsolved problem"})
    }
}


export const searchProblem = async (req: Request, res: Response) => {
  try {
    const { q, id } = req.query;

    // search by id
    if (id) {
      const problem = await prisma.problem.findUnique({
        where: { id: Number(id) },
      });

      if (!problem) {
        return res.status(404).json({ message: "Problem not found" });
      }

      return res.json(problem);
    }

    // search by title
    if (q) {
      const problems = await prisma.problem.findMany({
        where: {
          title: {
            contains: String(q),
            mode: "insensitive",
          },
        },
        orderBy: { id: "asc" },
      });

      return res.json(problems);
    }

    return res.status(400).json({
      message: "Provide problem id or search query",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Failed to Search Problem",
    });
  }
};




export const submissionProblem = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const problemId = Number(req.params.problemId);

    if (!Number.isInteger(problemId) || problemId <= 0) {
      return res.status(400).json({
        message: "Invalid problemId",
      });
    }

    const code = typeof req.body.code === "string" ? req.body.code : "";
    const language = req.body.language as Language;
    // Default to "RUN" if not specified, to maintain backward compatibility
    const mode = (typeof req.body.mode === "string" ? req.body.mode : "RUN") as "RUN" | "SUBMIT";

    
    if (!code.trim() || !language) {
      return res.status(403).json({
        message: "code and language required",
      });
    }

    if (!["node", "python", "java"].includes(language)) {
      return res.status(400).json({
        message: "Unsupported language. Use node, python, or java.",
      });
    }

    const problem = await prisma.problem.findUnique({
      where: { id: problemId },
    });

    if (!problem) {
      return res.status(400).json({
        message: "Problem not found",
      });
    }

    // Create the submission record initially
    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        language: language as Language,
        status: Status.PENDING, 
      },
    });

    if (mode === "SUBMIT") {
      // AI Review Mode
      // We process this asynchronously but we won't use the queue.
      // We'll trust the AI's judgment and set status to ACCEPTED (or whatever the AI implies, but for now ACCEPTED to show completion).
      // The user wants points and return.
      
      // Perform AI review
      getAIReview(code, language, problem.title, problem.description).then(async (aiResult) => {
        const finalScore = Math.max(30, aiResult.score || 0);

        await prisma.submission.update({
          where: { id: submission.id },
          data: {
            status: Status.ACCEPTED, // Reviewed
            score: finalScore,
            feedback: aiResult.feedback,
            executionMs: 0,
          }
        });
        
        // Real-time Activity Update
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        await prisma.activity.upsert({
            where: {
                userId_date: {
                    userId,
                    date: today
                }
            },
            update: { count: { increment: 1 } },
            create: { userId, date: today, count: 1 }
        });

      }).catch(err => {
        console.error("AI Review Failed:", err);
        // Mark as error if AI fails
        prisma.submission.update({
            where: { id: submission.id },
            data: { status: Status.RUNTIME_ERROR } // Or some other status
        }).catch(e => console.error(e));
      });

      // Return immediately so the frontend can poll for the result
      return res.status(201).json({
        message: "Problem submitted for AI review",
        submissionId: submission.id,     
      });

    } else {
      // "RUN" Mode -> Test Cases
      await submissionQueue.add("evaluate-submission", {
        submissionId: submission.id,
        type: "NORMAL",
      });

      return res.status(201).json({
        message: "Problem submission received",
        submissionId: submission.id,     
      });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Submission failed",
    });
  }
};
