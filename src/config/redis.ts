import Redis from "ioredis";

export const redisConnection = process.env.REDIS_URL 
    ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
    : new Redis({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
        maxRetriesPerRequest: null,
    });

// Casting to any to avoid version mismatch errors between ioredis and bullmq's internal ioredis
export const redisQueueConfig: any = redisConnection;