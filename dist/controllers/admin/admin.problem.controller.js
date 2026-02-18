"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAllProblem = exports.deleteById = exports.updateProblem = exports.getProblemById = exports.getAllProblem = exports.createProblem = void 0;
const prisma_1 = __importDefault(require("../../config/prisma"));
const createProblem = async (req, res) => {
    try {
        const createdBy = req.user.id;
        const { title, description, difficulty, type, examples, constraints } = req.body;
        const problem = await prisma_1.default.problem.create({
            data: {
                title,
                description,
                difficulty,
                type,
                examples,
                constraints,
                createdBy,
            },
        });
        if (!problem) {
            return res.status(404).json({ message: " Problem not created" });
        }
        res.status(200).json(problem);
    }
    catch (error) {
        res.status(500).json({ message: " Failed to create problem" });
    }
};
exports.createProblem = createProblem;
const getAllProblem = async (req, res) => {
    try {
        const adminId = req.user.id;
        const problems = await prisma_1.default.problem.findMany({
            where: { createdBy: adminId },
            orderBy: { createdAt: "desc" }
        });
        if (!problems) {
            return res.status(404).json({ message: " Problems not found" });
        }
        res.status(200).json(problems);
    }
    catch (error) {
        res.status(500).json({ message: " Failed to fetch Probelms" });
    }
};
exports.getAllProblem = getAllProblem;
const getProblemById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const adminId = req.user.id;
        const problem = await prisma_1.default.problem.findUnique({
            where: { id,
                createdBy: adminId,
            }
        });
        if (!problem) {
            return res.status(400).json({ message: "problem not found " });
        }
        res.json(problem);
    }
    catch (error) {
        res.status(500).json({ message: " Failed to fetch problem " });
    }
};
exports.getProblemById = getProblemById;
const updateProblem = async (req, res) => {
    try {
        const createdBy = req.user.id;
        const { title, description, difficulty, examples, constraints } = req.body;
        const id = Number(req.params.id);
        const updateProblem = await prisma_1.default.problem.update({
            where: { id },
            data: {
                title,
                description,
                difficulty,
                examples,
                constraints,
                createdBy
            }
        });
        if (!updateProblem) {
            return res.status(404).json({ message: " Problem not updated" });
        }
        res.json(updateProblem);
    }
    catch (error) {
        res.status(500).json({ message: " failed to update problem" });
    }
};
exports.updateProblem = updateProblem;
const deleteById = async (req, res) => {
    try {
        const id = Number(req.params.id);
        const adminId = req.user.id;
        const deProblem = await prisma_1.default.problem.delete({
            where: { id,
                createdBy: adminId,
            }
        });
        res.json("Problem deleted successfully");
    }
    catch (error) {
        res.status(500).json({ message: " failed to delete problem" });
    }
};
exports.deleteById = deleteById;
const deleteAllProblem = async (req, res) => {
    try {
        const deleteProblem = await prisma_1.default.problem.deleteMany();
        res.json(" All problem deleted successfully");
    }
    catch (error) {
        res.status(500).json({ message: " failed to delete all probem" });
    }
};
exports.deleteAllProblem = deleteAllProblem;
