const fs = require("fs");
const vm = require("vm");

const testsPayload = JSON.parse(fs.readFileSync("./tests.json", "utf-8"));
const userCode = fs.readFileSync("./user_code.js", "utf-8");
const entryFunction = testsPayload.entryFunction || "solve";
const tests = Array.isArray(testsPayload.tests) ? testsPayload.tests : [];

const normalize = (value) => {
  if (typeof value === "string") return value.trim();
  if (value === undefined || value === null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

let solveFn = null;

try {
  const context = {
    module: { exports: {} },
    exports: {},
    require,
    console: {
      log: () => {},
      error: () => {},
      warn: () => {},
    },
    setTimeout,
    clearTimeout,
  };

  vm.createContext(context);
  vm.runInContext(userCode, context, { timeout: 1500 });

  if (typeof context.module.exports === "function") {
    solveFn = context.module.exports;
  } else if (
    context.module.exports &&
    typeof context.module.exports[entryFunction] === "function"
  ) {
    solveFn = context.module.exports[entryFunction];
  } else if (typeof context[entryFunction] === "function") {
    solveFn = context[entryFunction];
  }

  if (!solveFn) {
    throw new Error(
      `Function "${entryFunction}" not found. Export it or define it in global scope.`
    );
  }

  let passed = 0;
  let failed = 0;
  const results = [];
  const start = Date.now();

  for (const test of tests) {
    try {
      const output = solveFn(test.input);
      const ok = normalize(output) === normalize(test.expected);
      if (ok) passed += 1;
      if (!ok) failed += 1;

      results.push({
        input: test.input,
        expected: test.expected,
        output,
        passed: ok,
      });
    } catch (error) {
      failed += 1;
      results.push({
        input: test.input,
        expected: test.expected,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(
    JSON.stringify({
      status: failed === 0 ? "PASSED" : "FAILED",
      passed,
      failed,
      total: tests.length,
      executionMs: Date.now() - start,
      results,
    })
  );
} catch (error) {
  console.log(
    JSON.stringify({
      status: "ERROR",
      passed: 0,
      failed: tests.length || 0,
      total: tests.length || 0,
      executionMs: 0,
      results: [],
      error: error instanceof Error ? error.message : String(error),
    })
  );
}
