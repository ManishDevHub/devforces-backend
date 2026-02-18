"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runBotTests = runBotTests;
function runBotTests(fn, tests) {
    let score = 0;
    tests.forEach(t => {
        const output = fn(t.input);
        if (output.include(t.constains))
            score++;
    });
    return {
        score,
        total: tests.length,
        scoreNum: tests.length > 0 ? (score / tests.length) * 100 : 0
    };
}
