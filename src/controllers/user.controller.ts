import { Request, Response } from "express";
import { prisma } from '../config/prisma'



export const createUser = async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    const user = await prisma.user.create({
      data: { email, name },
    });

    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
