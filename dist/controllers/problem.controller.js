"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionProblem = exports.searchProblem = exports.getUnsolvedProblem = exports.getSolveProblem = exports.getSingleProblem = exports.getAllProblems = void 0;
const prisma_1 = __importDefault(require("../config/prisma"));
const submission_queue_1 = require("../queues/submission.queue");
const enums_1 = require("../generated/prisma/enums");
const getAllProblems = async (req, res) => {
    try {
        const problems = await prisma_1.default.problem.findMany({
            select: {
                id: true,
                title: true,
                difficulty: true,
                type: true,
                createdAt: true,
            },
            orderBy: { createdAt: "desc" }
        });
        res.json(problems);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ Message: " Failed to fetch problems" });
    }
};
exports.getAllProblems = getAllProblems;
const getSingleProblem = async (req, res) => {
    try {
        const problemId = Number(req.params.problemId);
        const problem = await prisma_1.default.problem.findUnique({
            where: { id: problemId },
            select: {
                id: true,
                title: true,
                description: true,
                difficulty: true,
                type: true,
                examples: true,
                constraints: true,
            }
        });
        if (!problem) {
            return res.status(404).json({ Message: " Problem not found" });
        }
        res.json(problem);
    }
    catch (error) {
        res.status(500).json({ message: " Failed to Fetch problem" });
    }
};
exports.getSingleProblem = getSingleProblem;
const getSolveProblem = async (req, res) => {
    try {
        const userId = req.body.id;
        const solved = await prisma_1.default.submission.findMany({
            where: {
                id: userId,
                status: "ACCEPTED"
            },
            distinct: ["problemId"],
            select: {
                problem: {
                    select: {
                        id: true,
                        title: true,
                        difficulty: true,
                    }
                }
            }
        });
        res.json(solved.map(s => s.problem));
    }
    catch (error) {
        res.status(500).json({ message: " Failed to Fetch  solved problem" });
    }
};
exports.getSolveProblem = getSolveProblem;
const getUnsolvedProblem = async (req, res) => {
    try {
        const userId = req.body.id;
        const solvedId = await prisma_1.default.submission.findMany({
            where: {
                userId,
                status: "ACCEPTED",
            },
            distinct: ["problemId"],
            select: { problemId: true }
        });
        const solvedProblemIds = solvedId.map(p => p.problemId);
        const unsolved = await prisma_1.default.problem.findMany({
            where: {
                id: { notIn: solvedProblemIds }
            },
            select: {
                id: true,
                title: true,
                difficulty: true,
            }
        });
        res.json(unsolved);
    }
    catch (error) {
        res.status(500).json({ message: " Failed to Fetch unsolved problem" });
    }
};
exports.getUnsolvedProblem = getUnsolvedProblem;
const searchProblem = async (req, res) => {
    try {
        const { q, id } = req.query;
        // search by id
        if (id) {
            const problem = await prisma_1.default.problem.findUnique({
                where: { id: Number(id) },
            });
            if (!problem) {
                return res.status(404).json({ message: "Problem not found" });
            }
            return res.json(problem);
        }
        // search by title
        if (q) {
            const problems = await prisma_1.default.problem.findMany({
                where: {
                    title: {
                        contains: String(q),
                        mode: "insensitive",
                    },
                },
                orderBy: { id: "asc" },
            });
            return res.json(problems);
        }
        return res.status(400).json({
            message: "Provide problem id or search query",
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "Failed to Search Problem",
        });
    }
};
exports.searchProblem = searchProblem;
const submissionProblem = async (req, res) => {
    try {
        const userId = req.user.id;
        const problemId = Number(req.params.problemId);
        if (!Number.isInteger(problemId) || problemId <= 0) {
            return res.status(400).json({
                message: "Invalid problemId",
            });
        }
        const code = typeof req.body.code === "string" ? req.body.code : "";
        const language = req.body.language;
        if (!code.trim() || !language) {
            return res.status(403).json({
                message: "code and language required",
            });
        }
        if (!["node", "python", "java"].includes(language)) {
            return res.status(400).json({
                message: "Unsupported language. Use node, python, or java.",
            });
        }
        const problem = await prisma_1.default.problem.findUnique({
            where: { id: problemId },
        });
        if (!problem) {
            return res.status(400).json({
                message: "Problem not found",
            });
        }
        const submission = await prisma_1.default.submission.create({
            data: {
                userId,
                problemId,
                code,
                language: language,
                status: enums_1.Status.PENDING,
            },
        });
        await submission_queue_1.submissionQueue.add("evaluate-submission", {
            submissionId: submission.id,
            type: "NORMAL",
        });
        return res.status(201).json({
            message: "Problem submission received",
            submissionId: submission.id,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            message: "submission failed into",
        });
    }
};
exports.submissionProblem = submissionProblem;
