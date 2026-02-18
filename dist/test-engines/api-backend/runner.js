"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runApiTests = runApiTests;
async function runApiTests(fn, tests) {
    let passed = 0;
    for (const t of tests) {
        const res = fn(t.input);
        if (res.status === t.status)
            passed++;
    }
    return {
        passed,
        total: tests.length,
        score: tests.length > 0 ? (passed / tests.length) * 100 : 0
    };
}
