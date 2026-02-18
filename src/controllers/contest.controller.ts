
import { Request , Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import prisma from "../config/prisma";

import { submissionQueue } from "../queues/submission.queue";
import { ContestType, Language, Status } from "../generated/prisma/enums";

export const getAllContest = async ( req: AuthRequest, res: Response) =>{
    try{
          const userId = req.user?.id;
        const contests = await prisma.contest.findMany({
    include: {
      registrations: userId
        ? {
            where: { userId },
            select: { id: true },
          }
        : false,
         _count: {
          select: {
            problems: true,  
          },
        },
    },
  });
        if( !contests){
            return res.status(404).json({message: " Contest not found"})
        }
         const formatted = contests.map(contest => ({
    ...contest,
    isRegistered: contest.registrations
      ? contest.registrations.length > 0
      : false,
      problems: contest._count.problems,
  }));

        res.json(formatted);

    }catch( error){
        console.log(error);
        res.status(500).json({ Message: " Failed to fetch contest "})
    }

}


export const getUpcomingContest = async ( req: Request, res: Response) => {
    try{

        const now = new Date();
        const upcomCon = await prisma.contest.findMany({
            where: { startTime: {gt: now}},
            orderBy: { startTime: "asc"}
        })

        if(!upcomCon){
            return res.status(404).json({ message: " UpcomingContest not Found"});
        }

        res.json(upcomCon);

    }catch(error){
        res.status(500).json({message: "Failed to Fetch UpcomingContest "});
    }
}

export const getLiveContest = async ( req: Request , res: Response) => {
    try{

        const now = new Date();

        const getLivCo = await prisma.contest.findMany({
            where: {
                startTime: { lte : now},
                endTime: { gte : now}
            }
        })

        if(!getLivCo){
            return res.status(404).json({ message: " Live contest Not found"});
        }

        res.json(getLivCo);
    } catch( error) { 
        res.status(500).json({ message: " Failed to Fetch LiveContest "})
    }
}


export const getPastContest = async ( req: Request , res: Response) => {
    try{ 
        const now = new Date();
        const pastCon = await prisma.contest.findMany({
            where: { endTime: { lt : now}},
            orderBy: { endTime: 'desc'},

        })

        if( !pastCon){
            return res.status( 404).json({ message: " PastContest not found"})

        }

        res.json( pastCon);

    }catch( error) { 
        res.status(500).json({message: " Failed to fetch Past contest"})
    }
}


export const getContestByType  = async ( req: Request, res: Response) =>{
    try{
        const { type } = req.params;
        
        const getByType = await prisma.contest.findMany({
            where: { type: type as ContestType},
           
            orderBy: { startTime: 'desc'}
        })

        if( !getByType){
            return res.status(404).json({ message: " this contest nor found"});
        }
        res.json(getByType);

    }catch( error) {
        res.status(500).json({ message: " Failed to fetch "})
    }
}

export const getContestDetails = async (req: AuthRequest, res: Response) => {
  try {
    const contestId = Number(req.params.contestId);
    const userId = req.user.id;

    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
      include: {
        problems: {
          include: {
            problem: {
              select: {
                id: true,
                title: true,
                description: true,
                difficulty: true,
                examples: true,
                constraints: true,
                type: true,
              },
            },
          },
        },
        registrations: {
          where: { userId },
        },
      },
    });

    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    res.json({
      id: contest.id,
      title: contest.title,
      startTime: contest.startTime,
      endTime: contest.endTime,
      problems: contest.problems.map((p, index) => ({
        ...p.problem,
        order: index + 1,
      })),
      joined: contest.registrations.length > 0,
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contest details" });
  }
};

export const joinContest = async ( req: AuthRequest,  res: Response) => {
    try{ 

        const contestId = Number( req.params.contestId);
        const userId = req.user.id;

        const contest = await prisma.contest.findUnique({
            where: { id: contestId},

        })
        if( !contest){
            return res.status(404).json({message : " Contest not found"})
        }

          const alreadyRegistered = await prisma.contestRegistration.findUnique({
      where: {
        userId_contestId: {
          userId,
          contestId,
        },
      },
    });

    if (alreadyRegistered) {
      return res.status(400).json({ message: "Already registered" });
    }

        await prisma.contestRegistration.create({
            data:{ contestId , userId}
        })

        res.json({ message: "Successfully joined contest"});

    }catch ( error ) {
        res.status(500).json({message: " Failed to joinContest"});
    }
}


export const submissionContestProblem = async ( req:AuthRequest , res: Response) =>{

    try{

        const problemId = Number(req.params.problemId);
        const contestId = Number(req.params.contestId);
        const userId = req.user.id;
        const code = typeof req.body.code === "string" ? req.body.code : "";
        const language = req.body.language as Language;

        if( !code.trim() || !language){
            return res.status(401).json({ message: " code and language required"});
        }

        if (!["node", "python", "java"].includes(language)) {
            return res.status(400).json({ message: "Unsupported language. Use node, python, or java." });
        }

        const contest = await prisma.contest.findUnique({
            where:{
                id: contestId,
            }
        })

        if(!contest){
            return res.status(400).json({ message: " Contest not found"})
        }

          const now = new Date();
            if (now < contest.startTime || now > contest.endTime) {
                      return res.status(400).json({
                                            message: "contest not live",
                                      });
                                           }

        const contestProblem = await prisma.contestProblem.findUnique({
            where:{
                contestId_problemId:{
                    contestId,
                    problemId,
                },
            },
        })

        if (!contestProblem) {
            return res.status(400).json({ message: "Problem not found in this contest" });
        }

        const submission = await prisma.contestSubmission.create({
            data:{
                userId,
                problemId,
                contestId , 
                code ,
                language: language as Language,
                status: Status.PENDING,

            }
        })

        await submissionQueue.add("evaluate-submission" , {
            submissionId: submission.id,
            contestId,
            type:"CONTEST",
        })

    return res.status(201).json({
            message: " contest submission received",
            submissionId: submission.id,
        })

    }catch(error){
        console.error(error);
        res.status(500).json({message: " Contest Submission failed"})
    }
}
