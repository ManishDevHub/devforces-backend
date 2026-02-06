-- CreateEnum
CREATE TYPE "DifficultyContest" AS ENUM ('EASY', 'MEDIUM', 'HARD');

-- AlterTable
ALTER TABLE "Contest" ADD COLUMN     "difficultycon" "DifficultyContest" NOT NULL DEFAULT 'MEDIUM';
