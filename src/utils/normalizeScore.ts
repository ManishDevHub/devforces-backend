

import { DIFFICULTY_MULTIPLIER, TYPE_MULTIPLIER } from "../constants/scoring";

export function normalizeScore(params:{
    rowScore:number,
    difficulty: string,
    problemType: string

}) {

    const difficultyFactor = DIFFICULTY_MULTIPLIER[params.difficulty]??1

    const typeFactor = TYPE_MULTIPLIER[params.problemType ] ??1
    const normalized = params.rowScore * difficultyFactor * typeFactor;

    return Math.max(0 , Math.min(100, Math.round(normalized)))
}


