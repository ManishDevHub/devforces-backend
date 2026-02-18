
import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        const leaderboard = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                avatar: true,
                points: true,
            },
            orderBy: {
                points: "desc",
            },
        });

        res.json(leaderboard);
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
};
