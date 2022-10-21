import http from "http";
import WebSocket from "ws";
import express from 'express';

const app = express();

app.set("view engine", "pug")
app.set("views", __dirname + "/views")
app.use("/public", express.static(__dirname + "/public"))

app.get("/", (req, res) => res.render("home"))
app.get("/*", (req, res) => res.redirect("/"))

const handleListen = () => console.log('listening on http://localhost:3000')
// app.listen(3000, handleListen)
const server = http.createServer(app)
const wss = new WebSocket.Server({server})

const sockets = []

// 서버쪽의 소켓 핸들링
wss.on("connection", (socket) => {
  sockets.push(socket)
  socket["nickname"] = "Anonymous"
  console.log("Connected to Browser")
  socket.on("close", () => console.log("Disconnected from Browser"))
  socket.on("message", (msg) => {
    // socket.send(`${msg}`)
    const message = JSON.parse(msg);
    // sockets.forEach(aSocket => aSocket.send(`${message.payload}`))
    switch(message.type){
      case "new_message":
        sockets.forEach(aSocket => aSocket.send(`${socket.nickname}: ${message.payload}`))
        break;
      case "nickname":
        socket["nickname"] = message.payload;
        break;
    }

  })
  socket.send('hello!!') // 메세지 전송  서버->클라이언트
})






server.listen(3000, handleListen)

