import http from "http";
// import SocketIO from 'socket.io'
import { Server } from 'socket.io'
import { instrument } from '@socket.io/admin-ui'
import express from 'express';

const app = express();

app.set("view engine", "pug")
app.set("views", __dirname + "/views")
app.use("/public", express.static(__dirname + "/public"))

app.get("/", (req, res) => res.render("home"))
app.get("/*", (req, res) => res.redirect("/"))

// http 서버를 socket IO 와 연결해주는 작업.
// 한 포트에서 두 프로토콜을 같이 사용하기 위한 작업
const httpServer = http.createServer(app)
// const wsServer = SocketIO(httpServer)
// socket io 가 제공해주는 URL
// http://localhost:3000/socket.io/socket.io.js

const wsServer = new Server(httpServer, {
  cors: {
    origin: ['https://admin.socket.io'],
    credentials: true
  }
});

instrument(wsServer, {
  auth: false
})


// 어려운 프라이빗룸. 공용룸
// 공용룸목록을 리턴
function publicRooms() {
  const sids = wsServer.sockets.adapter.sids;
  const rooms = wsServer.sockets.adapter.rooms;

  // 아래처럼 구조분해 할당도 가능
  // const { sockets: { adapter: { sids, rooms }}} = wsServer;

  const publicRooms = [];
  rooms.forEach((_, key) => {
    console.log(key)
    if(sids.get(key) === undefined){
      publicRooms.push(key)
    }
  })
  return publicRooms
}

function countRoom(roomName) {
  return wsServer.sockets.adapter.rooms.get(roomName)?.size
}

// 연결 이벤트 핸들러
wsServer.on('connection', (socket) => {
  // 임시 이름
  socket['nickname'] = 'Anon'

  // 어떤 이벤트가 일어나든 간에 호출된다.
  // adapter 확인
 /* socket.onAny((event) => {
    console.log(wsServer.sockets.adapter)
    console.log(`socket Event: ${event}`)
  })*/

  // 입장 이벤트 발생
  socket.on('enter_room',(roomNm, done) => {

    // 화면에서 온 콜백 실행
    done()

    // 다양한 정보를 알 수 있다.
    // console.log(socket.id)
    // console.log(socket.rooms)
    // socket.join(roomNm);
    // console.log(socket.rooms)

    // 채팅방으로 join 시키기
    socket.join(roomNm);
    // 화면으로 이벤트 emit
    socket.to(roomNm).emit('welcome', socket.nickname, countRoom(roomNm))
    wsServer.sockets.emit('room_change', publicRooms())
  })

  socket.on('new_message', (msg, room, done) => {
    socket.to(room).emit('send_message', `${socket.nickname} : ${msg}`)
    done()
  })

  socket.on('disconnecting', () => {
    socket.rooms.forEach(room => {
      socket.to(room).emit('bye', socket.nickname, countRoom(room) - 1)
    })
  })

  socket.on('disconnect', () => {
    wsServer.sockets.emit('room_change', publicRooms())
  })

  socket.on('nickname', (nickname) => {
    socket['nickname'] = nickname
  })
})

const handleListen = () => console.log('listening on http://localhost:3000')
httpServer.listen(3000, handleListen)


