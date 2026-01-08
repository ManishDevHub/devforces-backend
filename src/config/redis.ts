
import Redis from "ioredis";
import { ConnectionOptions } from "bullmq";

export const redisConnection = new Redis({
    host: "127.0.0.1",
    port: 6379
})

export const redisQueueConfig: ConnectionOptions = {
    host: "127.0.0.1",
    port: 6379,
}