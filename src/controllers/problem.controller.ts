
import { Request, Response } from "express";
import prisma from "../config/prisma";
import { auth, AuthRequest } from "../middlewares/auth";
import { submissionQueue } from "../queues/submission.queue";
import { Status } from "../generated/prisma/enums";

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
        res.status(500).json({ message: " Failed to Fetch problem"});
    }
}


export const getSolveProblem = async ( req: AuthRequest, res: Response) =>{

    try{
        const userId = req.body.id;

    const solved = await prisma.submission.findMany({
        where:{ 
            id: userId,
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
        const userId = req.body.id;

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

    const { code, language } = req.body;

    
    if (!code || !language) {
      return res.status(403).json({
        message: "code and language required",
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

    const submission = await prisma.submission.create({
      data: {
        userId,
        problemId,
        code,
        language,
        status: Status.PENDING, 
      },
    });

    await submissionQueue.add("evaluate-submission",{
      submission:submission.id,
      type:"NORMAL",
    })

    return res.status(201).json({
      message: "Problem submission received",
      submissionId: submission.id,
     
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "submission failed into",
    });
  }
};