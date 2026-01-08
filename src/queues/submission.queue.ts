
import { Queue } from "bullmq";

import { redisQueueConfig } from "../config/redis";

export const submissionQueue = new Queue("submission-queue", {
    connection: redisQueueConfig,
})