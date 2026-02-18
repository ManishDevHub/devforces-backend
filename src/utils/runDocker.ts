import { execFile } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";
import { promisify } from "util";

import { Language } from "../generated/prisma/enums";

const execFileAsync = promisify(execFile);

export interface SandboxTestCase {
  input: any;
  expected: string;
}

export interface SandboxResultRow {
  input: string;
  expected: string;
  output?: string;
  passed: boolean;
  error?: string;
}

export interface SandboxTestResult {
  status: "PASSED" | "FAILED" | "ERROR";
  passed: number;
  failed: number;
  total: number;
  executionMs: number;
  results: SandboxResultRow[];
  error?: string;
}

interface RunDockerParams {
  language: Language;
  code: string;
  tests: SandboxTestCase[];
  entryFunction?: string;
}

const IMAGE_BY_LANGUAGE: Record<Language, string> = {
  node: "sandbox-node",
  python: "sandbox-python",
  java: "sandbox-java",
};

const CODE_FILE_BY_LANGUAGE: Record<Language, string> = {
  node: "user_code.js",
  python: "main.py",
  java: "Solution.java",
};

const getSandboxTemplateDir = (language: Language) => {
  const srcPath = path.resolve(process.cwd(), "src", "sandbox", language);
  if (fs.existsSync(srcPath)) {
    return srcPath;
  }

  const distPath = path.resolve(process.cwd(), "dist", "sandbox", language);
  if (fs.existsSync(distPath)) {
    return distPath;
  }

  throw new Error(`Sandbox template not found for language: ${language}`);
};

const copyRunnerAssets = (language: Language, workspaceDir: string) => {
  const templateDir = getSandboxTemplateDir(language);

  const filesByLanguage: Record<Language, string[]> = {
    node: ["runner.js"],
    python: ["runner.py"],
    java: ["Runner.java", "runner.sh"],
  };

  for (const filename of filesByLanguage[language]) {
    const sourceFile = path.join(templateDir, filename);
    const targetFile = path.join(workspaceDir, filename);
    fs.copyFileSync(sourceFile, targetFile);
  }
};

const safeParseSandboxOutput = (
  stdout: string,
  stderr: string,
  fallbackExecutionMs: number
): SandboxTestResult => {
  const raw = stdout.trim();

  if (!raw) {
    return {
      status: "ERROR",
      passed: 0,
      failed: 0,
      total: 0,
      executionMs: fallbackExecutionMs,
      results: [],
      error: stderr || "Sandbox produced no output",
    };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<SandboxTestResult>;
    return {
      status: parsed.status === "PASSED" || parsed.status === "FAILED" ? parsed.status : "ERROR",
      passed: Number(parsed.passed || 0),
      failed: Number(parsed.failed || 0),
      total: Number(parsed.total || 0),
      executionMs: Number(parsed.executionMs || fallbackExecutionMs),
      results: Array.isArray(parsed.results) ? parsed.results : [],
      error: parsed.error,
    };
  } catch {
    return {
      status: "ERROR",
      passed: 0,
      failed: 0,
      total: 0,
      executionMs: fallbackExecutionMs,
      results: [],
      error: stderr || "Invalid JSON output from sandbox",
    };
  }
};

export const runDocker = async ({
  language,
  code,
  tests,
  entryFunction = "solve",
}: RunDockerParams): Promise<SandboxTestResult> => {
  const workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), "devforces-submission-"));
  const start = Date.now();

  try {
    copyRunnerAssets(language, workspaceDir);

    fs.writeFileSync(path.join(workspaceDir, CODE_FILE_BY_LANGUAGE[language]), code, "utf-8");
    fs.writeFileSync(
      path.join(workspaceDir, "tests.json"),
      JSON.stringify({ entryFunction, tests }),
      "utf-8"
    );

    if (language === "node") {
      fs.writeFileSync(
        path.join(workspaceDir, "package.json"),
        JSON.stringify({ type: "commonjs" }),
        "utf-8"
      );
    }

    const dockerMountPath =
      process.platform === "win32" ? workspaceDir.replace(/\\/g, "/") : workspaceDir;

    const args = [
      "run",
      "--rm",
      "--network",
      "none",
      "--memory",
      "256m",
      "--cpus",
      "1",
      "--pids-limit",
      "128",
      "-v",
      `${dockerMountPath}:/app`,
      IMAGE_BY_LANGUAGE[language],
    ];

    const { stdout, stderr } = await execFileAsync("docker", args, {
      timeout: 12_000,
    });

    return safeParseSandboxOutput(stdout, stderr, Date.now() - start);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sandbox execution failed";
    return {
      status: "ERROR",
      passed: 0,
      failed: tests.length,
      total: tests.length,
      executionMs: Date.now() - start,
      results: [],
      error: message,
    };
  } finally {
    fs.rmSync(workspaceDir, { recursive: true, force: true });
  }
};
