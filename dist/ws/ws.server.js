"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ws_1 = require("ws");
const ioredis_1 = __importDefault(require("ioredis"));
const prisma_1 = __importDefault(require("../config/prisma"));
const wss = new ws_1.WebSocketServer({ port: 8080 });
console.log(" Websocket running on port 8080");
const redisPub = new ioredis_1.default({
    host: "127.0.0.1",
    port: 6379,
});
const redisSub = new ioredis_1.default({
    host: "127.0.0.1",
    port: 6379,
});
redisPub.on("connect", () => {
    console.log("Redis PUB connected");
});
redisSub.on("connect", () => {
    console.log("Redis SUB connected");
});
redisPub.on("error", (err) => {
    console.error("Redis PUB error:", err.message);
});
redisSub.on("error", (err) => {
    console.error("Redis SUB error:", err.message);
});
const allUsers = [];
redisSub.subscribe("chat");
redisSub.on("message", (channel, message) => {
    if (channel === "chat") {
        for (const s of allUsers) {
            if (s.readyState === ws_1.WebSocket.OPEN) {
                s.send(message);
            }
        }
    }
});
wss.on("connection", async (socket) => {
    console.log("User connected");
    allUsers.push(socket);
    const history = await prisma_1.default.chatMessage.findMany({
        orderBy: { createdAt: "asc" },
        take: 50,
        include: {
            user: {
                select: {
                    id: true,
                    name: true,
                },
            },
        },
    });
    history.forEach((msg) => {
        socket.send(JSON.stringify({
            type: "history",
            data: msg,
        }));
    });
    socket.on("message", async (e) => {
        const data = JSON.parse(e.toString());
        if (data.type === "send") {
            const saved = await prisma_1.default.chatMessage.create({
                data: {
                    userId: data.userId,
                    message: data.message,
                }
            });
            redisPub.publish("chat", JSON.stringify({
                type: "send",
                data: saved
            }));
        }
        if (data.type === "edit") {
            const messageId = data.messageId;
            const msg = await prisma_1.default.chatMessage.findUnique({
                where: { id: data.messageId }
            });
            if (msg && msg.userId === data.userId) {
                const updated = await prisma_1.default.chatMessage.update({
                    where: { id: data.messageId },
                    data: { message: data.message }
                });
                redisPub.publish("chat", JSON.stringify({
                    type: "edit",
                    data: updated
                }));
            }
        }
        if (data.type === "delete") {
            const msg = await prisma_1.default.chatMessage.findUnique({
                where: { id: data.messageId }
            });
            if (msg && msg.userId === data.userId) {
                await prisma_1.default.chatMessage.delete({
                    where: { id: data.messageId }
                });
                redisPub.publish("chat", JSON.stringify({
                    type: "delete",
                    messageId: data.messageId
                }));
            }
        }
    });
    socket.on("close", () => {
        const index = allUsers.indexOf(socket);
        if (index !== -1) {
            allUsers.splice(index, 1);
        }
    });
});
