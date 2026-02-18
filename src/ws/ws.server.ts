import "dotenv/config";
import { WebSocketServer, WebSocket } from "ws";
import Redis from "ioredis";
import prisma from "../config/prisma";


const port = Number(process.env.WS_PORT) || 8080;
const wss = new WebSocketServer({ port });
console.log(` Websocket running on port ${port}`);

const redisPub = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
});
const redisSub = new Redis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: Number(process.env.REDIS_PORT) || 6379,
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
const allUsers: WebSocket[] = [];

redisSub.subscribe("chat");
redisSub.on("message" , ( channel , message) => {
   if( channel === "chat"){
      for( const s of allUsers){
         if( s.readyState === WebSocket.OPEN){
            s.send(message);
         }
      }
   }
})

wss.on("connection",  async (socket: WebSocket) => {
  console.log("User connected");
  try {
      allUsers.push(socket);

      const history = await prisma.chatMessage.findMany({
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

      history.forEach( (msg:any) => {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: "history",
                data: msg,
            }));
        }
      });
  } catch (err) {
      console.error("Connection handling error:", err);
  }

  socket.on("message",  async (e) => {
      // ... existing message handling ...

   const data = JSON.parse(e.toString())


   if( data.type === "send"){
     
      const saved = await prisma.chatMessage.create({
         data:{
            userId:data.userId,
            message:data.message,
         }
      })
    
   
   redisPub.publish("chat" , JSON.stringify({
      type: "send",
      data: saved
   }))

}

if( data.type === "edit"){
   const messageId = data.messageId;

   const msg = await prisma.chatMessage.findUnique({
      where:{ id: data.messageId}
   })

   if ( msg && msg.userId === data.userId){
      const updated = await prisma.chatMessage.update({
         where:{ id: data.messageId},
         data:{ message: data.message}
      })

      redisPub.publish("chat" , JSON.stringify({
         type:"edit",
         data: updated
      }))
   }
}

if( data.type === "delete"){

   const msg = await prisma.chatMessage.findUnique({
      where:{ id: data.messageId}
   })

   if( msg && msg.userId === data.userId){
      await prisma.chatMessage.delete({
         where:{ id: data.messageId}
      })

      redisPub.publish("chat" , JSON.stringify({
         type: "delete",
         messageId: data.messageId
         
      }))
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
