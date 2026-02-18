"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDocker = void 0;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const util_1 = require("util");
const execFileAsync = (0, util_1.promisify)(child_process_1.execFile);
const IMAGE_BY_LANGUAGE = {
    node: "sandbox-node",
    python: "sandbox-python",
    java: "sandbox-java",
};
const CODE_FILE_BY_LANGUAGE = {
    node: "user_code.js",
    python: "main.py",
    java: "Solution.java",
};
const getSandboxTemplateDir = (language) => {
    const srcPath = path_1.default.resolve(process.cwd(), "src", "sandbox", language);
    if (fs_1.default.existsSync(srcPath)) {
        return srcPath;
    }
    const distPath = path_1.default.resolve(process.cwd(), "dist", "sandbox", language);
    if (fs_1.default.existsSync(distPath)) {
        return distPath;
    }
    throw new Error(`Sandbox template not found for language: ${language}`);
};
const copyRunnerAssets = (language, workspaceDir) => {
    const templateDir = getSandboxTemplateDir(language);
    const filesByLanguage = {
        node: ["runner.js"],
        python: ["runner.py"],
        java: ["Runner.java", "runner.sh"],
    };
    for (const filename of filesByLanguage[language]) {
        const sourceFile = path_1.default.join(templateDir, filename);
        const targetFile = path_1.default.join(workspaceDir, filename);
        fs_1.default.copyFileSync(sourceFile, targetFile);
    }
};
const safeParseSandboxOutput = (stdout, stderr, fallbackExecutionMs) => {
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
        const parsed = JSON.parse(raw);
        return {
            status: parsed.status === "PASSED" || parsed.status === "FAILED" ? parsed.status : "ERROR",
            passed: Number(parsed.passed || 0),
            failed: Number(parsed.failed || 0),
            total: Number(parsed.total || 0),
            executionMs: Number(parsed.executionMs || fallbackExecutionMs),
            results: Array.isArray(parsed.results) ? parsed.results : [],
            error: parsed.error,
        };
    }
    catch {
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
const runDocker = async ({ language, code, tests, entryFunction = "solve", }) => {
    const workspaceDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), "devforces-submission-"));
    const start = Date.now();
    try {
        copyRunnerAssets(language, workspaceDir);
        fs_1.default.writeFileSync(path_1.default.join(workspaceDir, CODE_FILE_BY_LANGUAGE[language]), code, "utf-8");
        fs_1.default.writeFileSync(path_1.default.join(workspaceDir, "tests.json"), JSON.stringify({ entryFunction, tests }), "utf-8");
        const dockerMountPath = process.platform === "win32" ? workspaceDir.replace(/\\/g, "/") : workspaceDir;
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
            timeout: 12000,
        });
        return safeParseSandboxOutput(stdout, stderr, Date.now() - start);
    }
    catch (error) {
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
    }
    finally {
        fs_1.default.rmSync(workspaceDir, { recursive: true, force: true });
    }
};
exports.runDocker = runDocker;
