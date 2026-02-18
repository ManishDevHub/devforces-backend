"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const bullmq_1 = require("bullmq");
const evaluateSubmission_1 = require("../ai/evaluateSubmission");
const prisma_1 = __importDefault(require("../config/prisma"));
const redis_1 = require("../config/redis");
const enums_1 = require("../generated/prisma/enums");
const normalizeScore_1 = require("../utils/normalizeScore");
const runDocker_1 = require("../utils/runDocker");
const toJsonValue = (value) => JSON.parse(JSON.stringify(value));
const toComparableValue = (value) => {
    if (typeof value === "string") {
        return value.trim();
    }
    if (value === null || value === undefined) {
        return "";
    }
    return JSON.stringify(value);
};
const toSandboxTests = (examples) => {
    if (!examples)
        return [];
    if (typeof examples === "object" &&
        !Array.isArray(examples) &&
        examples !== null &&
        "tests" in examples &&
        Array.isArray(examples.tests)) {
        return examples.tests
            .map((test) => ({
            input: toComparableValue(test.input),
            expected: toComparableValue(test.expected ?? test.output ?? test.status ?? test.contains ?? ""),
        }))
            .filter((test) => test.input.length > 0 || test.expected.length > 0);
    }
    if (Array.isArray(examples)) {
        return examples
            .map((test) => {
            if (typeof test === "object" && test !== null) {
                const candidate = test;
                return {
                    input: toComparableValue(candidate.input),
                    expected: toComparableValue(candidate.expected ?? candidate.output ?? candidate.status ?? ""),
                };
            }
            return { input: toComparableValue(test), expected: "" };
        })
            .filter((test) => test.input.length > 0 || test.expected.length > 0);
    }
    if (typeof examples === "object" && examples !== null) {
        const candidate = examples;
        if ("input" in candidate || "output" in candidate || "expected" in candidate) {
            return [
                {
                    input: toComparableValue(candidate.input),
                    expected: toComparableValue(candidate.expected ?? candidate.output ?? ""),
                },
            ];
        }
    }
    return [];
};
const mapSandboxToStatus = (result) => {
    if (result.status === "PASSED") {
        return enums_1.Status.ACCEPTED;
    }
    const error = (result.error || "").toLowerCase();
    if (error.includes("timeout") || error.includes("time limit")) {
        return enums_1.Status.TIME_LIMIT;
    }
    if (error.includes("compile")) {
        return enums_1.Status.COMPILATION_ERROR;
    }
    if (error.includes("syntaxerror")) {
        return enums_1.Status.COMPILATION_ERROR;
    }
    if (error.includes("runtime") || error.includes("exception")) {
        return enums_1.Status.RUNTIME_ERROR;
    }
    return enums_1.Status.WRONG_ANSWER;
};
const processNormalSubmission = async (submissionId) => {
    const submission = await prisma_1.default.submission.findUnique({
        where: { id: submissionId },
        include: { problem: true },
    });
    if (!submission) {
        return;
    }
    const tests = toSandboxTests(submission.problem.examples);
    if (tests.length === 0) {
        await prisma_1.default.submission.update({
            where: { id: submissionId },
            data: {
                status: enums_1.Status.RUNTIME_ERROR,
                feedback: toJsonValue({
                    verdict: enums_1.Status.RUNTIME_ERROR,
                    message: "No test cases configured for this problem.",
                }),
            },
        });
        return;
    }
    await prisma_1.default.submission.update({
        where: { id: submissionId },
        data: { status: enums_1.Status.RUNNING },
    });
    const sandboxResult = await (0, runDocker_1.runDocker)({
        language: submission.language,
        code: submission.code,
        tests,
    });
    const sandboxStatus = mapSandboxToStatus(sandboxResult);
    const aiReview = await (0, evaluateSubmission_1.evaluateSubmission)({
        problem: submission.problem.description,
        constraints: submission.problem.constraints ?? "",
        language: submission.language,
        code: submission.code,
        testResult: sandboxResult,
        problemType: submission.problem.type,
    });
    const aiVerdict = aiReview.verdict in enums_1.Status ? aiReview.verdict : enums_1.Status.WRONG_ANSWER;
    const finalStatus = sandboxStatus === enums_1.Status.ACCEPTED ? aiVerdict : sandboxStatus;
    const rawScore = sandboxStatus === enums_1.Status.ACCEPTED ? aiReview.score : Math.min(aiReview.score, 50);
    const normalizedScore = (0, normalizeScore_1.normalizeScore)({
        rowScore: rawScore,
        difficulty: submission.problem.difficulty,
        problemType: submission.problem.type,
    });
    await prisma_1.default.submission.update({
        where: { id: submissionId },
        data: {
            status: finalStatus,
            score: normalizedScore,
            executionMs: sandboxResult.executionMs,
            feedback: toJsonValue({
                verdict: finalStatus,
                score: normalizedScore,
                ai: aiReview,
                sandbox: sandboxResult,
            }),
        },
    });
};
const processContestSubmission = async (submissionId) => {
    const submission = await prisma_1.default.contestSubmission.findUnique({
        where: { id: submissionId },
        include: { problem: true, contest: true },
    });
    if (!submission) {
        return;
    }
    const tests = toSandboxTests(submission.problem.examples);
    if (tests.length === 0) {
        await prisma_1.default.contestSubmission.update({
            where: { id: submissionId },
            data: {
                status: enums_1.Status.RUNTIME_ERROR,
                feedback: toJsonValue({
                    verdict: enums_1.Status.RUNTIME_ERROR,
                    message: "No test cases configured for this problem.",
                }),
            },
        });
        return;
    }
    await prisma_1.default.contestSubmission.update({
        where: { id: submissionId },
        data: { status: enums_1.Status.RUNNING },
    });
    const sandboxResult = await (0, runDocker_1.runDocker)({
        language: submission.language,
        code: submission.code,
        tests,
    });
    const sandboxStatus = mapSandboxToStatus(sandboxResult);
    const aiReview = await (0, evaluateSubmission_1.evaluateSubmission)({
        problem: submission.problem.description,
        constraints: submission.problem.constraints ?? "",
        language: submission.language,
        code: submission.code,
        testResult: sandboxResult,
        problemType: submission.problem.type,
    });
    const aiVerdict = aiReview.verdict in enums_1.Status ? aiReview.verdict : enums_1.Status.WRONG_ANSWER;
    const finalStatus = sandboxStatus === enums_1.Status.ACCEPTED ? aiVerdict : sandboxStatus;
    const rawScore = sandboxStatus === enums_1.Status.ACCEPTED ? aiReview.score : Math.min(aiReview.score, 50);
    const normalizedScore = (0, normalizeScore_1.normalizeScore)({
        rowScore: rawScore,
        difficulty: submission.problem.difficulty,
        problemType: submission.problem.type,
    });
    await prisma_1.default.contestSubmission.update({
        where: { id: submissionId },
        data: {
            status: finalStatus,
            score: normalizedScore,
            executionMs: sandboxResult.executionMs,
            feedback: toJsonValue({
                verdict: finalStatus,
                score: normalizedScore,
                ai: aiReview,
                sandbox: sandboxResult,
            }),
        },
    });
};
const worker = new bullmq_1.Worker("submission-queue", async (job) => {
    const { type, submissionId } = job.data;
    if (!submissionId || !type) {
        throw new Error("Invalid job payload");
    }
    if (type === "NORMAL") {
        await processNormalSubmission(submissionId);
        return;
    }
    if (type === "CONTEST") {
        await processContestSubmission(submissionId);
        return;
    }
    throw new Error(`Unsupported submission type: ${type}`);
}, {
    connection: redis_1.redisQueueConfig,
});
worker.on("completed", (job) => {
    console.log(`[submission-worker] completed job ${job.id}`);
});
worker.on("failed", (job, err) => {
    console.error(`[submission-worker] failed job ${job?.id}`, err);
});
