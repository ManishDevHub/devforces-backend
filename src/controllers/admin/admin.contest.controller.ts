

import { Request,Response } from "express";
import prisma from "../../config/prisma";
import { AuthRequest } from "../../middlewares/auth";

import { ContestStatus } from "../../generated/prisma";

export const createContest = async (req: AuthRequest, res: Response) => {
  try {
    const { title, type, startTime, endTime } = req.body;
    const adminId = req.user.id;

    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    let status: ContestStatus;

    if (now < start) status = ContestStatus.UPCOMING;
    else if (now <= end) status = ContestStatus.LIVE;
    else status = ContestStatus.COMPLETED;

    const contest = await prisma.contest.create({
      data: {
        title,
        type,
        startTime: start,
        endTime: end,
        status,
        createdBy: adminId,
      },
    });

    return res.json(contest);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create contest" });
  }
};


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




export const addProblemsToContest = async (req: Request, res: Response) => {
  try {
    const contestId = Number(req.params.contestId);
    const { problemIds } = req.body;

    if (!contestId) {
      return res.status(400).json({ message: "Invalid contestId" });
    }

    

    
    const contest = await prisma.contest.findUnique({
      where: { id: contestId },
    });

    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    
    const problems = await prisma.problem.findMany({
      where: {
        id: { in: problemIds },
      },
      select: { id: true },
    });

    if (problems.length !== problemIds.length) {
      return res.status(400).json({
        message: "One or more problemIds are invalid",
      });
    }

    
    const mappings = problemIds.map((problemId: number) => ({
      contestId,
      problemId,
    }));

    await prisma.contestProblem.createMany({
      data: mappings,
      skipDuplicates: true,
    });

    return res.json({
      message: "Problems added to contest successfully",
    });

  } catch (error) {
    console.error("ADD PROBLEM ERROR:", error);
    return res.status(500).json({
      message: "Failed to add problem in contest",
    });
  }
};
