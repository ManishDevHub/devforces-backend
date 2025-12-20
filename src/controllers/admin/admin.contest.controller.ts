

import { Request,Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth";

export const createContest = async (req: AuthRequest , res: Response) =>{

    try{
        const { title , type , startTime , endTime} = req.body;
        const adminId = req.user.id;
        const constest = await prisma.contest.create({
            data: {
                title,
                type,
                startTime: new Date (startTime),
                endTime: new Date(endTime),
                status:"UPCOMING",
                createdBy:adminId,
            }
        })
        if(!constest){
            return res.status(404).json({ message : " Contest not Created"});
        }
        res.json(constest);

    }catch( error){
        res.status(500).json({ message: " Failed to Create contest"});
    }
}

export const updateContest = async (req: Request, res: Response) => {
  try {
    const contestId = Number(req.params.id);

    if (isNaN(contestId)) {
      return res.status(400).json({ message: "Invalid contest id" });
    }

    const { title, type, startTime, endTime, status } = req.body;

    const updatedContest = await prisma.contest.update({
      where: {
        id: contestId,
      },
      data: {
        ...(title && { title }),
        ...(type && { type }),
        ...(status && { status }),
        ...(startTime && { startTime: new Date(startTime) }),
        ...(endTime && { endTime: new Date(endTime) }),
      },
    });

    return res.json({
      message: "Contest updated successfully",
      contest: updatedContest,
    });

  } catch (error) {
    console.error("UPDATE CONTEST ERROR:", error);
    return res.status(500).json({
      message: "Failed to update contest",
    });
  }
};


export const deleteConById = async ( req: Request, res: Response) =>{
    try{

        const constestId = Number( req.params.id);
    const deleteCon = await prisma.contest.delete({
        where:{ id: constestId}
    })

    if(!deleteCon){
        return res.status(404).json({message : " contest not deleted!"})
    }
    res.json(" This contest successfully deleted");

    }catch(error){
        res.status(500).json({ message: " Failed to delete contest"});
    }
}


export const deleteAllContest = async (req: Request , res: Response) =>{
    try{
        await prisma.contest.deleteMany()

        res.json(" AllContest successfully deleted");

    }catch( error){
        res.status(500).json({ message: " Failed to deleteAll contest"})
    }
}

export const getAllConByAdmin = async ( req:AuthRequest, res: Response) =>{
    try{

        const adminId = req.user.id;

        const allContest = await prisma.contest.findMany({
            where:{
                createdBy: adminId
            },
            orderBy: { createdAt:"desc"}
        })
        if(!allContest){
            return res.status(404).json({ message: " Contest Not Found"});
        }

        res.json(allContest);

    }catch(error){
        res.status(500).json({ message: " Failed to getContest "})
    }
}

export const getById = async ( req: AuthRequest , res: Response) =>{
    try{

    const adminId = req.user.id;
    const contestId = Number(req.params.id);
    const contestById = await prisma.contest.findUnique({
        where: {
            id: contestId,
            createdBy:adminId,
        },
        include: {
            problems:{
                include:{
                    problem:  true
                }
            }
        }
    })

    if(!contestById){
        return res.status(404).json({ message: " Contest not Found"})
    }
    res.json(contestById);

    }catch( error){
        res.status(500).json({ message: " Failed to fetch contest"})
    }
}


export const addProblemToContest = async (req: Request, res:Response) =>{
    try{
        const constestId = Number(req.body.constestId);
        const { problemIds} = req.body;

        const mapping = problemIds.map((problemId: Number) => ({
            constestId,
            problemId,
        }))

        const addProblem = await prisma.contestProblem.createMany({
            data: mapping,
            skipDuplicates: true,
        })

        if(!addProblem){
            res.status(404).json({ meassge: " Problem not added"})
        }
        res.json(" Problem add to contest");

    }catch(error){
        res.status(500).json({ message: " Failed to add problems in contest"});
    }
}