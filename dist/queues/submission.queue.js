"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.submissionQueue = void 0;
const bullmq_1 = require("bullmq");
const redis_1 = require("../config/redis");
exports.submissionQueue = new bullmq_1.Queue("submission-queue", {
    connection: redis_1.redisQueueConfig,
});
