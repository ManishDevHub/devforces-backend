
import { Request , Response } from "express";
import { AuthRequest } from "../middlewares/auth";
import prisma from "../config/prisma";
import { Status } from "../generated/prisma";

import { ContestType } from "../generated/prisma";

export const getAllContest = async ( req: Request, res: Response) =>{
    try{

        const contests = await prisma.contest.findMany({
            orderBy: { startTime: "desc"}
        })
        if( !contests){
            return res.status(404).json({message: " Contest not found"})
        }
        res.json(contests);

    }catch( error){
        console.log(error);
        res.status(500).json({ Message: " Failed to fetch contest "})
    }

}


export const getUpcommingContest = async ( req: Request, res: Response) => {
    try{

        const now = new Date();
        const upcomCon = await prisma.contest.findMany({
            where: { startTime: {gt: now}},
            orderBy: { startTime: "asc"}
        })

        if(!upcomCon){
            return res.status(404).json({ message: " UpcommingContest not Found"});
        }

        res.json(upcomCon);

    }catch(error){
        res.status(500).json({messahe: "Failed to Fetch UpcommingContest "});
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

export const getContestDetails = async ( req: AuthRequest , res: Response) =>{
    try{
        const contestId = Number( req.params.contestId)
        const userId = req.user.id;

        const getDetails = await prisma.contest.findUnique({
            where: { id: contestId},
            include:{
                problems:{
                    include: {
                        problem:{
                            select: { id: true , title: true, difficulty: true}
                        }
                    }
                },
                registrations: {
                    where: { userId}
                }
            }
        })

        if( !getDetails){
            return res.status(404).json({ message: " Details not found"});
        }
        res.json({
            ...getDetails,
            joined: getDetails.registrations.length > 0
        })

    }catch(error){
        res.status(500).json({ message: " Failed to found contestDetails"})
    }
}

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
        const { code , language} = req.body;

        if( !code || !language){
            return res.status(401).json({ message: " code and language required"});
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

        const submission = await prisma.contestSubmission.create({
            data:{
                userId,
                problemId,
                contestId , 
                code ,
                language,
                status: Status.PENDING,

            }
        })

        res.status(201).json({
            message: " contest submission resived",
            submissionId: submission.id,
        })

    }catch(error){
        console.error(error);
        res.status(500).json({message: " Contest Submission failed"})
    }
}