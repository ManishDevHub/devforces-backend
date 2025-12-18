
import { Request, Response } from "express";
import prisma from "../config/prisma";
import { auth, AuthRequest } from "../middlewares/auth";

export const getAllProblems = async ( req: AuthRequest, res:Response) =>{
    try{

        const problems = prisma.problem.findMany({
            select:{
                id:true,
                title: true,
                difficulty:true,
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


export const getSingleProblem = async ( req:Request, res: Response) => {
    try{
        const problemId = Number( req.params.problemId);

        const problem = await prisma.problem.findUnique({
            where: { id: problemId},
            select:{
                id: true,
                title:true,
                description: true,
                difficulty: true,
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