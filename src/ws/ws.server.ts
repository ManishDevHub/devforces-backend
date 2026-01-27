import { WebSocketServer, WebSocket } from "ws";
import Redis from "ioredis";
import prisma from "../config/prisma";


const wss = new WebSocketServer({ port: 8080 });
console.log(" Websocket running on port 8080");

const redisPub = new Redis();
const redisSub =  new Redis();
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

  allUsers.push(socket);

  const history = await prisma.chatMessage.findMany({
      orderBy:{ createdAt: "asc"},
      take:50,
  })

  history.forEach( (msg) => {
   socket.send(JSON.stringify({
      type: "history",
      data: msg,
   }))
  })

  socket.on("message",  async (e) => {

   const data = JSON.parse(e.toString())


   if( data.type === "send"){

      const saved = await prisma.chatMessage.create({
         data:{
            userId:data.userId,
            message:data.message
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
