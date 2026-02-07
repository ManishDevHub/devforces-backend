

import { Request, Response } from "express";
import prisma from "../../config/prisma";

import { AuthRequest } from "../../middlewares/auth";


export const createProblem = async ( req: AuthRequest , res: Response) => {
    try{
         const createdBy = req.user.id;
        const { title , description,difficulty,type, examples, constraints} = req.body
       
        const problem = await prisma.problem.create({
            data: {
                title,
                description,
                difficulty,
                type,
                examples,
                constraints,
                createdBy,
            },
        })

        if( !problem){
            return res.status(404).json({message: " Problem not created"})
        }
        res.status(200).json(problem);
         
    }catch( error){
        res.status(500).json({ message: " Failed to create problem"})
    }
}

export const getAllProblem = async ( req: AuthRequest, res: Response) => {

    try {

        const adminId = req.user.id;

        const problems = await prisma.problem.findMany({
            where:{ createdBy: adminId},
            orderBy: { createdAt: "desc"}
        })

        if(!problems){
            return res.status(404).json({ message: " Problems not found"});
        }
        res.status(200).json(problems);

    }catch(error){
        res.status(500).json({message: " Failed to fetch Probelms"})
    }
}

export const getProblemById = async (req: AuthRequest, res: Response) =>{
    try{
        const id = Number( req.params.id);
        const adminId = req.user.id;

        const problem = await prisma.problem.findUnique({
            where: { id,
                createdBy: adminId,
             }
        })
        if( !problem){
            return res.status(400).json({ message: "problem not found "})
        }

        res.json(problem);

    }catch(error){
        res.status(500).json({message: " Failed to fetch problem "})
    }
}

export const updateProblem = async ( req: AuthRequest , res: Response) =>{
    try{
        const createdBy = req.user.id
        const { title , description, difficulty, examples , constraints} = req.body;
        const id = Number(req.params.id)

        const updateProblem = await prisma.problem.update({
            where: {id},
            data:{
                title,
                description,
                difficulty,
                examples,
                constraints,
                createdBy
            }
        })

        if(!updateProblem){
            return res.status(404).json({ message: " Problem not updated"})
        }

        res.json(updateProblem);

    }catch(error){
        res.status(500).json({ message: " failed to update problem"})
    }
}

export const deleteById = async ( req: AuthRequest , res: Response) =>{
    try{
        const id = Number( req.params.id);
        const adminId = req.user.id;
        const deProblem = await prisma.problem.delete({
            where: {id,
                createdBy: adminId,
            }
        })
       
        res.json("Problem deleted successfully");


    }catch(error){
        res.status(500).json({ message: " failed to delete problem"})
    }
}

export const deleteAllProblem = async (req: Request, res: Response) =>{
    try{
        const deleteProblem = await prisma.problem.deleteMany()

        res.json(" All problem deleted successfully")

    }catch(error){
        res.status(500).json({ message: " failed to delete all probem"});
    }
}