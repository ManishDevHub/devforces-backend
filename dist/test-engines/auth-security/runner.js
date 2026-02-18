"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runAuthTests = runAuthTests;
function runAuthTests(fn, tests) {
    let passed = 0;
    for (const t of tests) {
        try {
            if (fn(t.input) === t.expected)
                passed++;
        }
        catch { }
    }
    return {
        passed,
        total: tests.length,
        score: tests.length > 0 ? (passed / tests.length) * 100 : 0
    };
}
