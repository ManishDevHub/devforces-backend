
import { Request, Response } from "express";
import prisma from "../config/prisma";

export const getLeaderboard = async (req: Request, res: Response) => {
    try {
        // 1. Fetch ALL users
        const allUsers = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                avatar: true,
            },
        });

        // 2. Fetch all submissions with scores > 0
        const submissions = await prisma.submission.findMany({
            select: {
                userId: true,
                problemId: true,
                score: true,
            },
            where: {
                score: {
                    gt: 0,
                },
            },
        });

        // 3. Calculate max score per problem per user
        const userProblemMaxScore = new Map<string, number>(); // Key: `${userId}-${problemId}`

        submissions.forEach((sub) => {
            const key = `${sub.userId}-${sub.problemId}`;
            const currentMax = userProblemMaxScore.get(key) || 0;
            if ((sub.score || 0) > currentMax) {
                userProblemMaxScore.set(key, sub.score || 0);
            }
        });

        // 4. Sum up scores per user
        const userTotalScore = new Map<string, number>(); // Key: userId

        userProblemMaxScore.forEach((score, key) => {
            const userId = key.split("-")[0];
            const currentTotal = userTotalScore.get(userId) || 0;
            userTotalScore.set(userId, currentTotal + score);
        });

        // 5. Construct final leaderboard including ALL users
        const leaderboard = allUsers.map((user) => ({
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            points: userTotalScore.get(user.id) || 0, // Default to 0 if no score
        }));

        // 6. Sort by points descending
        leaderboard.sort((a, b) => b.points - a.points);

        res.json(leaderboard);


    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
};
