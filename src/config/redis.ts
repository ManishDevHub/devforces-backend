
import Redis from "ioredis";
import { ConnectionOptions } from "bullmq";

export const redisConnection = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
    maxRetriesPerRequest: null, // Essential for BullMQ
})

export const redisQueueConfig: ConnectionOptions = {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
}