

import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080});


wss.on("connection" , ( socket) =>{
 console.log(" user Conected");

 socket.on( "message" , (e) => {
    console.log("message data " + e.toString());
 })
    
})