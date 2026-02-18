"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addProblemsToContest = exports.getById = exports.getAllConByAdmin = exports.deleteAllContest = exports.deleteConById = exports.updateContest = exports.createContest = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const enums_1 = require("../../generated/prisma/enums");
const createContest = async (req, res) => {
    try {
        const { title, type, startTime, endTime } = req.body;
        const adminId = req.user.id;
        const start = new Date(startTime);
        const end = new Date(endTime);
        const now = new Date();
        let status;
        if (now < start)
            status = enums_1.ContestStatus.UPCOMING;
        else if (now <= end)
            status = enums_1.ContestStatus.LIVE;
        else
            status = enums_1.ContestStatus.COMPLETED;
        const contest = await prisma_1.default.contest.create({
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
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Failed to create contest" });
    }
};
exports.createContest = createContest;
const updateContest = async (req, res) => {
    try {
        const contestId = Number(req.params.id);
        if (isNaN(contestId)) {
            return res.status(400).json({ message: "Invalid contest id" });
        }
        const { title, type, startTime, endTime, status } = req.body;
        const updatedContest = await prisma_1.default.contest.update({
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
    }
    catch (error) {
        console.error("UPDATE CONTEST ERROR:", error);
        return res.status(500).json({
            message: "Failed to update contest",
        });
    }
};
exports.updateContest = updateContest;
const deleteConById = async (req, res) => {
    try {
        const constestId = Number(req.params.id);
        const deleteCon = await prisma_1.default.contest.delete({
            where: { id: constestId }
        });
        if (!deleteCon) {
            return res.status(404).json({ message: " contest not deleted!" });
        }
        res.json(" This contest successfully deleted");
    }
    catch (error) {
        res.status(500).json({ message: " Failed to delete contest" });
    }
};
exports.deleteConById = deleteConById;
const deleteAllContest = async (req, res) => {
    try {
        await prisma_1.default.contest.deleteMany();
        res.json(" AllContest successfully deleted");
    }
    catch (error) {
        res.status(500).json({ message: " Failed to deleteAll contest" });
    }
};
exports.deleteAllContest = deleteAllContest;
const getAllConByAdmin = async (req, res) => {
    try {
        const adminId = req.user.id;
        const allContest = await prisma_1.default.contest.findMany({
            where: {
                createdBy: adminId
            },
            orderBy: { createdAt: "desc" }
        });
        if (!allContest) {
            return res.status(404).json({ message: " Contest Not Found" });
        }
        res.json(allContest);
    }
    catch (error) {
        res.status(500).json({ message: " Failed to getContest " });
    }
};
exports.getAllConByAdmin = getAllConByAdmin;
const getById = async (req, res) => {
    try {
        const adminId = req.user.id;
        const contestId = Number(req.params.id);
        const contestById = await prisma_1.default.contest.findUnique({
            where: {
                id: contestId,
                createdBy: adminId,
            },
            include: {
                problems: {
                    include: {
                        problem: true
                    }
                }
            }
        });
        if (!contestById) {
            return res.status(404).json({ message: " Contest not Found" });
        }
        res.json(contestById);
    }
    catch (error) {
        res.status(500).json({ message: " Failed to fetch contest" });
    }
};
exports.getById = getById;
const addProblemsToContest = async (req, res) => {
    try {
        const contestId = Number(req.params.contestId);
        const { problemIds } = req.body;
        if (!contestId) {
            return res.status(400).json({ message: "Invalid contestId" });
        }
        const contest = await prisma_1.default.contest.findUnique({
            where: { id: contestId },
        });
        if (!contest) {
            return res.status(404).json({ message: "Contest not found" });
        }
        const problems = await prisma_1.default.problem.findMany({
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
        const mappings = problemIds.map((problemId) => ({
            contestId,
            problemId,
        }));
        await prisma_1.default.contestProblem.createMany({
            data: mappings,
            skipDuplicates: true,
        });
        return res.json({
            message: "Problems added to contest successfully",
        });
    }
    catch (error) {
        console.error("ADD PROBLEM ERROR:", error);
        return res.status(500).json({
            message: "Failed to add problem in contest",
        });
    }
};
exports.addProblemsToContest = addProblemsToContest;
