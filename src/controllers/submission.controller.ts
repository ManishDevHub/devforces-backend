import { Response } from "express";

import prisma from "../config/prisma";
import { AuthRequest } from "../middlewares/auth";

type SubmissionKind = "NORMAL" | "CONTEST";

const isValidSubmissionKind = (value: string | undefined): value is SubmissionKind =>
  value === "NORMAL" || value === "CONTEST";

export const getSubmissionResult = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const submissionId = Number(req.params.submissionId);

    if (!Number.isInteger(submissionId) || submissionId <= 0) {
      return res.status(400).json({ message: "Invalid submissionId" });
    }

    const requestedType = typeof req.query.type === "string" ? req.query.type.toUpperCase() : "NORMAL";
    if (!isValidSubmissionKind(requestedType)) {
      return res.status(400).json({ message: "Invalid type. Use NORMAL or CONTEST." });
    }

    if (requestedType === "NORMAL") {
      const submission = await prisma.submission.findUnique({
        where: { id: submissionId },
        include: {
          problem: {
            select: {
              id: true,
              title: true,
              difficulty: true,
              type: true,
            },
          },
        },
      });

      if (!submission || submission.userId !== userId) {
        return res.status(404).json({ message: "Submission not found" });
      }

      return res.json({
        type: "NORMAL",
        id: submission.id,
        status: submission.status,
        score: submission.score,
        executionMs: submission.executionMs,
        feedback: submission.feedback,
        createdAt: submission.createdAt,
        problem: submission.problem,
        code: submission.code,
        language: submission.language,
      });
    }

    const contestSubmission = await prisma.contestSubmission.findUnique({
      where: { id: submissionId },
      include: {
        contest: {
          select: {
            id: true,
            title: true,
          },
        },
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            type: true,
          },
        },
      },
    });

    if (!contestSubmission || contestSubmission.userId !== userId) {
      return res.status(404).json({ message: "Submission not found" });
    }

    return res.json({
      type: "CONTEST",
      id: contestSubmission.id,
      status: contestSubmission.status,
      score: contestSubmission.score,
      executionMs: contestSubmission.executionMs,
      feedback: contestSubmission.feedback,
      createdAt: contestSubmission.createdAt,
      problem: contestSubmission.problem,
      contest: contestSubmission.contest,
      code: contestSubmission.code,
      language: contestSubmission.language,
    });
  } catch (error) {
    console.error("GET_SUBMISSION_RESULT_ERROR", error);
    return res.status(500).json({ message: "Failed to fetch submission result" });
  }
};

export const getProblemSubmissions = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const problemId = Number(req.params.problemId);

    if (!Number.isInteger(problemId) || problemId <= 0) {
      return res.status(400).json({ message: "Invalid problemId" });
    }

    const submissions = await prisma.submission.findMany({
      where: {
        userId,
        problemId,
      },
      select: {
        id: true,
        status: true,
        score: true,
        executionMs: true,
        language: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json(submissions);
  } catch (error) {
    console.error("GET_PROBLEM_SUBMISSIONS_ERROR", error);
    return res.status(500).json({ message: "Failed to fetch submission history" });
  }
};
// ... existing code ...

export const getUserHistory = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit ? Number(req.query.limit) : 10;

    const submissions = await prisma.submission.findMany({
      where: { userId },
      include: {
        problem: {
          select: {
            id: true,
            title: true,
            difficulty: true,
            type: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return res.json(submissions);
  } catch (error) {
    console.error("GET_USER_HISTORY_ERROR", error);
    res.status(500).json({ message: "Failed to fetch submission history" });
  }
};
