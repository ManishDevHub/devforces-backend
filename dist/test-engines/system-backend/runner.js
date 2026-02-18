"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSystemCheck = runSystemCheck;
function runSystemCheck(code) {
    return {
        retry: code.include("retry"),
        queue: code.include(" queue"),
        webhook: code.include(" signature")
    };
}
