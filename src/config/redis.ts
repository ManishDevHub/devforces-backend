import Redis from "ioredis";

export const redisConnection = process.env.REDIS_URL 
    ? new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null })
    : new Redis({
        host: process.env.REDIS_HOST || "127.0.0.1",
        port: Number(process.env.REDIS_PORT) || 6379,
        maxRetriesPerRequest: null,
    });

// BullMQ can accept the Redis instance directly as the connection option
export const redisQueueConfig = redisConnection;