"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSubmissionResult = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const isValidSubmissionKind = (value) => value === "NORMAL" || value === "CONTEST";
const getSubmissionResult = async (req, res) => {
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
            const submission = await prisma_1.default.submission.findUnique({
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
            });
        }
        const contestSubmission = await prisma_1.default.contestSubmission.findUnique({
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
        });
    }
    catch (error) {
        console.error("GET_SUBMISSION_RESULT_ERROR", error);
        return res.status(500).json({ message: "Failed to fetch submission result" });
    }
};
exports.getSubmissionResult = getSubmissionResult;
