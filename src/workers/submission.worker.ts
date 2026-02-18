import { Worker } from "bullmq";

import { evaluateSubmission } from "../ai/evaluateSubmission";
import prisma from "../config/prisma";
import { redisQueueConfig } from "../config/redis";
import { Status } from "../generated/prisma/enums";
import type { Prisma } from "../generated/prisma/client";
import { normalizeScore } from "../utils/normalizeScore";
import { runDocker, SandboxTestCase, SandboxTestResult } from "../utils/runDocker";

type SubmissionType = "NORMAL" | "CONTEST";

interface SubmissionJobData {
  type: SubmissionType;
  submissionId: number;
}

const toJsonValue = (value: unknown): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;

const toComparableValue = (value: unknown): string => {
  if (typeof value === "string") {
    return value.trim();
  }
  if (value === null || value === undefined) {
    return "";
  }
  return JSON.stringify(value);
};

const toSandboxTests = (examples: unknown): SandboxTestCase[] => {
  if (!examples) return [];

  if (
    typeof examples === "object" &&
    !Array.isArray(examples) &&
    examples !== null &&
    "tests" in examples &&
    Array.isArray((examples as { tests: unknown }).tests)
  ) {
    return (examples as { tests: Array<Record<string, unknown>> }).tests
      .map((test) => ({
        input: test.input,
        expected: toComparableValue(
          test.expected ?? test.output ?? test.status ?? test.contains ?? ""
        ),
      }))
      .filter((test) => test.input !== undefined);
  }

  if (Array.isArray(examples)) {
    return examples
      .map((test) => {
        if (typeof test === "object" && test !== null) {
          const candidate = test as Record<string, unknown>;
          return {
            input: candidate.input !== undefined ? candidate.input : candidate,
            expected: toComparableValue(
              candidate.expected ?? candidate.output ?? candidate.status ?? ""
            ),
          };
        }

        return { input: test, expected: "" };
      })
      .filter((test) => test.input !== undefined);
  }

  if (typeof examples === "object" && examples !== null) {
    const candidate = examples as Record<string, unknown>;
    if ("input" in candidate || "output" in candidate || "expected" in candidate) {
      return [
        {
          input: candidate.input,
          expected: toComparableValue(candidate.expected ?? candidate.output ?? ""),
        },
      ];
    }
  }

  return [];
};

const mapSandboxToStatus = (result: SandboxTestResult): Status => {
  if (result.status === "PASSED") {
    return Status.ACCEPTED;
  }

  if (result.status === "ERROR") {
    const error = (result.error || "").toLowerCase();
    if (error.includes("timeout") || error.includes("time limit")) return Status.TIME_LIMIT;
    return Status.RUNTIME_ERROR;
  }

  const error = (result.error || "").toLowerCase();

  if (error.includes("timeout") || error.includes("time limit")) {
    return Status.TIME_LIMIT;
  }

  if (error.includes("compile") || error.includes("syntax")) {
    return Status.COMPILATION_ERROR;
  }

  if (error.includes("runtime") || error.includes("exception")) {
    return Status.RUNTIME_ERROR;
  }

  return Status.WRONG_ANSWER;
};

const processNormalSubmission = async (submissionId: number) => {
  console.log(`[submission-worker] processing normal submission ${submissionId}`);
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { problem: true },
  });

  if (!submission) {
    return;
  }

  const tests = toSandboxTests(submission.problem.examples);

  if (tests.length === 0) {
    await prisma.submission.update({
      where: { id: submissionId },
      data: {
        status: Status.RUNTIME_ERROR,
        feedback: toJsonValue({
          verdict: Status.RUNTIME_ERROR,
          message: "No test cases configured for this problem.",
        }),
      },
    });
    return;
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: { status: Status.RUNNING },
  });

  const sandboxResult = await runDocker({
    language: submission.language,
    code: submission.code,
    tests,
  });

  const sandboxStatus = mapSandboxToStatus(sandboxResult);

  const aiReview = await evaluateSubmission({
    problem: submission.problem.description,
    constraints: submission.problem.constraints ?? "",
    language: submission.language,
    code: submission.code,
    testResult: sandboxResult,
    problemType: submission.problem.type,
  });

  const aiVerdict =
    aiReview.verdict in Status ? (aiReview.verdict as Status) : Status.WRONG_ANSWER;
  const finalStatus =
    sandboxStatus === Status.ACCEPTED ? aiVerdict : sandboxStatus;

  // USER REQUEST: if pass give total point
  // We use problem.points if available (default 100 if 0 or undefined)
  const totalPoints = (submission.problem as any).points || 100;
  
  let finalScore = 0;
  if (sandboxStatus === Status.ACCEPTED) {
    // If sandbox passed, full points regardless of AI score (unless AI strictness overrides?)
    // User requested "if pass give total point". We honor this.
    finalScore = totalPoints; 
  } else {
    // Partial points logic or 0
    finalScore = 0;
  }

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      status: finalStatus,
      score: finalScore,
      executionMs: sandboxResult.executionMs,
      feedback: toJsonValue({
        verdict: finalStatus,
        score: finalScore,
        ai: aiReview,
        sandbox: sandboxResult,
      }),
    },
  });

  // Update user total points if first time accepted
  if (finalStatus === Status.ACCEPTED) {
    const previousAccepted = await prisma.submission.findFirst({
      where: {
        userId: submission.userId,
        problemId: submission.problemId,
        status: Status.ACCEPTED,
        id: { not: submission.id },
      },
    });

    if (!previousAccepted) {
      await prisma.user.update({
        where: { id: submission.userId },
        data: { points: { increment: finalScore } },
      });
    }
  }

  // Real-time Activity Update
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  await prisma.activity.upsert({
      where: {
          userId_date: {
              userId: submission.userId,
              date: today
          }
      },
      update: {
          count: { increment: 1 }
      },
      create: {
          userId: submission.userId,
          date: today,
          count: 1
      }
  });
};

const processContestSubmission = async (submissionId: number) => {
  console.log(`[submission-worker] processing contest submission ${submissionId}`);
  const submission = await prisma.contestSubmission.findUnique({
    where: { id: submissionId },
    include: { problem: true, contest: true },
  });

  if (!submission) {
    return;
  }

  const tests = toSandboxTests(submission.problem.examples);

  if (tests.length === 0) {
    await prisma.contestSubmission.update({
      where: { id: submissionId },
      data: {
        status: Status.RUNTIME_ERROR,
        feedback: toJsonValue({
          verdict: Status.RUNTIME_ERROR,
          message: "No test cases configured for this problem.",
        }),
      },
    });
    return;
  }

  await prisma.contestSubmission.update({
    where: { id: submissionId },
    data: { status: Status.RUNNING },
  });

  const sandboxResult = await runDocker({
    language: submission.language,
    code: submission.code,
    tests,
  });

  const sandboxStatus = mapSandboxToStatus(sandboxResult);

  const aiReview = await evaluateSubmission({
    problem: submission.problem.description,
    constraints: submission.problem.constraints ?? "",
    language: submission.language,
    code: submission.code,
    testResult: sandboxResult,
    problemType: submission.problem.type,
  });

  const aiVerdict =
    aiReview.verdict in Status ? (aiReview.verdict as Status) : Status.WRONG_ANSWER;
  const finalStatus =
    sandboxStatus === Status.ACCEPTED ? aiVerdict : sandboxStatus;

  const rawScore =
    sandboxStatus === Status.ACCEPTED ? aiReview.score : Math.min(aiReview.score, 50);

  const normalizedScore = normalizeScore({
    rowScore: rawScore,
    difficulty: submission.problem.difficulty,
    problemType: submission.problem.type,
  });

  await prisma.contestSubmission.update({
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

  // Update user points for contest submission
  // For contest submissions, we might want to add points every time or just once?
  // Let's add points if it improves their score for this problem in this contest.
  if (finalStatus === Status.ACCEPTED) {
     const bestPrevious = await prisma.contestSubmission.findFirst({
       where: {
         userId: submission.userId,
         contestId: submission.contestId,
         problemId: submission.problemId,
         status: Status.ACCEPTED,
         id: { not: submission.id },
       },
       orderBy: { score: "desc" },
     });

     const previousBestScore = bestPrevious?.score || 0;
     const scoreGain = Math.max(0, normalizedScore - previousBestScore);

     if (scoreGain > 0) {
       await prisma.user.update({
         where: { id: submission.userId },
         data: { points: { increment: scoreGain } },
       });
     }
  }
};

const worker = new Worker(
  "submission-queue",
  async (job) => {
    const { type, submissionId } = job.data as SubmissionJobData;

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
  },
  {
    connection: redisQueueConfig,
  }
);

worker.on("completed", (job) => {
  console.log(`[submission-worker] completed job ${job.id}`);
});

worker.on("failed", (job, err) => {
  console.error(`[submission-worker] failed job ${job?.id}`, err);
});
