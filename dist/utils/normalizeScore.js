"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.normalizeScore = normalizeScore;
const scoring_1 = require("../constants/scoring");
function normalizeScore(params) {
    const difficultyFactor = scoring_1.DIFFICULTY_MULTIPLIER[params.difficulty] ?? 1;
    const typeFactor = scoring_1.TYPE_MULTIPLIER[params.problemType] ?? 1;
    const normalized = params.rowScore * difficultyFactor * typeFactor;
    return Math.max(0, Math.min(100, Math.round(normalized)));
}
